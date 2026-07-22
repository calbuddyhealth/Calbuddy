// ari/pipelines/ari-deliberation-pipeline.js
// Ari Deliberation Pipeline
//
// Purpose:
// Coordinate deterministic context preparation, OpenAI reasoning,
// semantic validation, response planning, and stage-level diagnostics.
//
// V2.2.0 — Deliberation Boundary Trace / Failure Isolation
//
// Canonical order:
// 1. Continuity
// 2. Safety
// 3. Situation
// 4. Memory
// 5. OpenAI Reasoning
// 6. Semantic Validation
// 7. Response Planning
//
// Authority model:
// - Deterministic stages prepare evidence and constraints.
// - OpenAI Reasoning is the sole semantic authority.
// - AriSemanticFrameValidator validates but never invents meaning.
// - Response Planning may consume only validated AI output.
// - This pipeline orchestrates stages but does not interpret meaning.
//
// Debug model:
// - Proves the deliberation pipeline was entered.
// - Records every stage start, completion, duration, readiness, and error.
// - Identifies the first internal failure boundary.
// - Preserves compact snapshots without duplicating full runtime packets.

window.Ari = window.Ari || {};

window.AriDeliberationPipeline = {
  version: "2.2.0",
  schemaVersion: "2.2.0",
  debugSchemaVersion: "1.0.0",
  source: "ari-deliberation-pipeline",
  architecture:
    "openai-semantic-authority-with-deterministic-validation",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {}
    } = runtime;

    const pipelineStartedAtMs =
      this.nowMs();

    let state = {
      ...summary,

      activePipelineLayer:
        "deliberation",

      deliberationStageErrors:
        this.toArray(
          summary.deliberationStageErrors
        )
    };

    state =
      this.initializeDeliberationDebugTrace(
        state,
        pipelineStartedAtMs
      );

    this.emitDebugLog(
      runtime,
      "pipeline_entered",
      {
        source:
          this.source,

        version:
          this.version,

        inputSnapshot:
          state.deliberationDebugTrace
            ?.inputSnapshot ||
          null
      }
    );

    const executivePacket =
      state.executivePacket ||
      this.buildFallbackExecutivePacket(
        state
      );

    state = {
      ...state,
      executivePacket
    };

    /* =====================================================
       1. CONTINUITY
    ===================================================== */

    state =
      await this.runTracedStage({
        state,
        runtime,
        mark,
        stageName:
          "continuity",
        markName:
          "continuityStage",
        stage:
          window.AriContinuityStage ||
          window.Ari?.continuityStage,
        inspect:
          nextState => ({
            ready:
              this.resolveStageReady(
                nextState,
                "continuity"
              ),
            outputAvailable:
              Boolean(
                nextState.continuityStagePacket ||
                nextState.continuityResolution
              ),
            diagnostics: {
              packetAvailable:
                Boolean(
                  nextState.continuityStagePacket
                ),
              resolutionAvailable:
                Boolean(
                  nextState.continuityResolution
                ),
              currentTurnWasResolved:
                nextState.currentTurnWasResolved ===
                true
            }
          })
      });

    /* =====================================================
       2. SAFETY
    ===================================================== */

    state =
      await this.runTracedStage({
        state,
        runtime,
        mark,
        stageName:
          "safety",
        markName:
          "safetyStage",
        stage:
          window.AriSafetyDeliberationStage ||
          window.Ari?.safetyDeliberationStage,
        inspect:
          nextState => ({
            ready:
              this.resolveStageReady(
                nextState,
                "safety"
              ),
            outputAvailable:
              Boolean(
                nextState.safetyStagePacket ||
                nextState.safetyDisposition
              ),
            diagnostics: {
              packetAvailable:
                Boolean(
                  nextState.safetyStagePacket
                ),
              dispositionAvailable:
                Boolean(
                  nextState.safetyDisposition
                )
            }
          })
      });

    /* =====================================================
       3. SITUATION
    ===================================================== */

    state =
      await this.runTracedStage({
        state,
        runtime,
        mark,
        stageName:
          "situation",
        markName:
          "situationStage",
        stage:
          window.AriSituationStage ||
          window.Ari?.situationStage,
        inspect:
          nextState => ({
            ready:
              this.resolveStageReady(
                nextState,
                "situation"
              ),
            outputAvailable:
              Boolean(
                nextState.situationStagePacket ||
                nextState.situationContract ||
                nextState.situationMap
              ),
            diagnostics: {
              packetAvailable:
                Boolean(
                  nextState.situationStagePacket
                ),
              contractAvailable:
                Boolean(
                  nextState.situationContract
                ),
              situationMapAvailable:
                Boolean(
                  nextState.situationMap
                )
            }
          })
      });

    /* =====================================================
       4. MEMORY
    ===================================================== */

    state =
      await this.runTracedStage({
        state,
        runtime,
        mark,
        stageName:
          "memory",
        markName:
          "memoryStage",
        stage:
          window.AriMemoryStage ||
          window.Ari?.memoryStage,
        inspect:
          nextState => ({
            ready:
              this.resolveStageReady(
                nextState,
                "memory"
              ),
            outputAvailable:
              Boolean(
                nextState.memoryStagePacket ||
                nextState.memoryHandoff ||
                nextState.memoryContext
              ),
            diagnostics: {
              packetAvailable:
                Boolean(
                  nextState.memoryStagePacket
                ),
              handoffAvailable:
                Boolean(
                  nextState.memoryHandoff
                ),
              memoryContextAvailable:
                Boolean(
                  nextState.memoryContext
                )
            }
          })
      });

    /* =====================================================
       5. OPENAI REASONING
    ===================================================== */

    state =
      this.beginDebugStage(
        state,
        "reasoning"
      );

    mark("before reasoningStage");

    this.emitDebugLog(
      runtime,
      "stage_started",
      {
        stage:
          "reasoning"
      }
    );

    state =
      await this.runStage(
        window.AriReasoningStage ||
        window.AriOpenAIReasoningStage ||
        window.Ari?.reasoningStage ||
        window.Ari?.openAIReasoningStage,
        state,
        runtime,
        "reasoning"
      );

    state =
      this.normalizeReasoningOutputs(
        state
      );

    state =
      this.completeDebugStage(
        state,
        "reasoning",
        {
          ready:
            state.reasoningReady ===
            true,

          source:
            state.reasoningStageSource ||
            state.cognitiveReasoningResult
              ?.source ||
            null,

          outputAvailable:
            Boolean(
              state.cognitiveReasoningResult
            ),

          error:
            state.reasoningStageError ||
            state.cognitiveReasoningResult
              ?.error ||
            null,

          diagnostics: {
            stageRan:
              state.reasoningStageRan ===
              true,
            stagePacketAvailable:
              Boolean(
                state.reasoningStagePacket
              ),
            reasoningResultAvailable:
              Boolean(
                state.cognitiveReasoningResult
              ),
            semanticFrameAvailable:
              Boolean(
                state.semanticFrame
              ),
            responseRequirementsAvailable:
              Boolean(
                state.responseRequirements
              ),
            modelInvocationAvailable:
              Boolean(
                state.modelInvocation
              ),
            modelInvocationSucceeded:
              state.modelInvocation
                ?.succeeded ??
              null,
            model:
              state.modelInvocation
                ?.model ||
              state.cognitiveReasoningResult
                ?.model ||
              state.cognitiveReasoningResult
                ?.modelId ||
              null
          }
        }
      );

    this.emitDebugLog(
      runtime,
      "stage_completed",
      this.readLatestDebugStage(
        state,
        "reasoning"
      )
    );

    mark("after reasoningStage");

    /* =====================================================
       6. SEMANTIC VALIDATION
    ===================================================== */

    state =
      this.beginDebugStage(
        state,
        "semantic_validation"
      );

    mark("before semanticValidationStage");

    this.emitDebugLog(
      runtime,
      "stage_started",
      {
        stage:
          "semantic_validation"
      }
    );

    state =
      await this.runSemanticValidationStage(
        state,
        runtime
      );

    state =
      this.normalizeSemanticValidationOutputs(
        state
      );

    state =
      this.completeDebugStage(
        state,
        "semantic_validation",
        {
          ready:
            this.isSemanticValidationAccepted(
              state
            ),

          source:
            state.semanticValidationStageSource ||
            state.semanticFrameValidatorResult
              ?.source ||
            null,

          outputAvailable:
            Boolean(
              state.semanticFrameValidatorResult ||
              state.semanticFrameValidation
            ),

          error:
            state.semanticValidationErrors
              ?.length
              ? state.semanticValidationErrors
              : state.semanticValidationStageError ||
                null,

          diagnostics: {
            stageRan:
              state.semanticValidationStageRan ===
              true,
            validatorResultAvailable:
              Boolean(
                state.semanticFrameValidatorResult
              ),
            accepted:
              state.semanticValidationAccepted ===
              true,
            rejected:
              state.semanticValidationRejected ===
              true,
            validatedFrameAvailable:
              Boolean(
                state.validatedSemanticFrame
              ),
            rejectedFrameAvailable:
              Boolean(
                state.rejectedSemanticFrame
              ),
            compatibilityAvailable:
              Boolean(
                state.semanticCompatibility
              ),
            errors:
              this.toArray(
                state.semanticValidationErrors
              ),
            warnings:
              this.toArray(
                state.semanticValidationWarnings
              )
          }
        }
      );

    this.emitDebugLog(
      runtime,
      "stage_completed",
      this.readLatestDebugStage(
        state,
        "semantic_validation"
      )
    );

    mark("after semanticValidationStage");

    /* =====================================================
       7. RESPONSE PLANNING
    ===================================================== */

    state =
      this.beginDebugStage(
        state,
        "response_planning"
      );

    mark("before responsePlanningStage");

    this.emitDebugLog(
      runtime,
      "stage_started",
      {
        stage:
          "response_planning"
      }
    );

    if (
      this.isSemanticValidationAccepted(
        state
      )
    ) {
      state =
        await this.runStage(
          window.AriResponsePlanningStage ||
          window.Ari?.responsePlanningStage,
          state,
          runtime,
          "response_planning"
        );
    } else {
      state = {
        ...state,

        responsePlanningStageRan:
          false,

        responsePlanningStageSource:
          "blocked-by-semantic-validation",

        responsePlanningStageError:
          "Response planning was blocked because semantic validation did not accept the AI semantic frame.",

        responsePlan:
          null,

        responseStrategy:
          null,

        deliberationStageErrors:
          this.appendUniqueError(
            state.deliberationStageErrors,
            {
              stage:
                "response_planning",
              error:
                "semantic_validation_not_accepted",
              message:
                "Response planning was blocked because semantic validation did not accept the AI semantic frame."
            }
          )
      };
    }

    const responsePlan =
      this.resolveResponsePlan(
        state
      );

    state =
      this.completeDebugStage(
        state,
        "response_planning",
        {
          ready:
            state.responsePlanningStageRan ===
              true &&
            this.isResponsePlanUsable(
              responsePlan
            ),

          source:
            state.responsePlanningStageSource ||
            null,

          outputAvailable:
            Boolean(
              responsePlan
            ),

          error:
            state.responsePlanningStageError ||
            null,

          diagnostics: {
            semanticValidationAccepted:
              this.isSemanticValidationAccepted(
                state
              ),
            stageRan:
              state.responsePlanningStageRan ===
              true,
            responsePlanAvailable:
              Boolean(
                responsePlan
              ),
            responsePlanUsable:
              this.isResponsePlanUsable(
                responsePlan
              )
          }
        }
      );

    this.emitDebugLog(
      runtime,
      "stage_completed",
      this.readLatestDebugStage(
        state,
        "response_planning"
      )
    );

    mark("after responsePlanningStage");

    /* =====================================================
       8. DIAGNOSTICS
    ===================================================== */

    const deliberationDiagnostics =
      this.buildDeliberationDiagnostics(
        state
      );

    state = {
      ...state,

      deliberationDiagnostics,

      deliberationHealthy:
        deliberationDiagnostics.healthy,

      deliberationWarnings:
        deliberationDiagnostics.warnings
    };

    /* =====================================================
       9. FINAL PACKET
    ===================================================== */

    state.deliberationPacket =
      this.buildDeliberationPacket(
        state
      );

    state.deliberationContract =
      state.deliberationPacket;

    state.deliberationPipelineRan =
      true;

    state.deliberationPipelineReady =
      state.deliberationPacket
        ?.ready === true;

    state.deliberationPipelineSource =
      this.source;

    state.deliberationPipelineVersion =
      this.version;

    state =
      this.finalizeDeliberationDebugTrace(
        state,
        pipelineStartedAtMs
      );

    // Keep the finalized trace available in the final packet.
    state.deliberationPacket = {
      ...state.deliberationPacket,

      debug: {
        available:
          true,

        trace:
          state.deliberationDebugTrace
      }
    };

    state.deliberationContract =
      state.deliberationPacket;

    this.emitDebugLog(
      runtime,
      "pipeline_completed",
      {
        ready:
          state.deliberationPipelineReady ===
          true,
        failureBoundary:
          state.deliberationDebugTrace
            ?.failureBoundary ||
          null,
        durationMs:
          state.deliberationDebugTrace
            ?.durationMs ||
          null,
        finalSnapshot:
          state.deliberationDebugTrace
            ?.finalSnapshot ||
          null
      }
    );

    return state;
  },

  /* =====================================================
     TRACED STAGE ORCHESTRATION
  ===================================================== */

  async runTracedStage({
    state = {},
    runtime = {},
    mark = () => {},
    stageName = "unknown",
    markName = "unknownStage",
    stage = null,
    inspect = null
  } = {}) {
    let nextState =
      this.beginDebugStage(
        state,
        stageName
      );

    mark(
      `before ${markName}`
    );

    this.emitDebugLog(
      runtime,
      "stage_started",
      {
        stage:
          stageName
      }
    );

    nextState =
      await this.runStage(
        stage,
        nextState,
        runtime,
        stageName
      );

    const inspection =
      typeof inspect ===
        "function"
        ? inspect(nextState) || {}
        : {};

    nextState =
      this.completeDebugStage(
        nextState,
        stageName,
        {
          ready:
            inspection.ready ??
            this.resolveStageReady(
              nextState,
              stageName
            ),
          source:
            inspection.source ||
            nextState[
              `${stageName}StageSource`
            ] ||
            null,
          outputAvailable:
            inspection.outputAvailable ===
            true,
          error:
            inspection.error ||
            nextState[
              `${stageName}StageError`
            ] ||
            null,
          diagnostics:
            inspection.diagnostics ||
            null
        }
      );

    this.emitDebugLog(
      runtime,
      "stage_completed",
      this.readLatestDebugStage(
        nextState,
        stageName
      )
    );

    mark(
      `after ${markName}`
    );

    return nextState;
  },

  /* =====================================================
     GENERIC STAGE RUNNER
  ===================================================== */

  async runStage(
    stage,
    summary = {},
    runtime = {},
    stageName = "unknown"
  ) {
    if (
      !stage ||
      typeof stage.run !==
        "function"
    ) {
      return this.appendStageError(
        summary,
        stageName,
        "stage_not_loaded",
        `The ${stageName} stage was not loaded.`,
        "not-loaded"
      );
    }

    try {
      const result =
        await stage.run(
          summary,
          runtime
        );

      if (
        !result ||
        typeof result !==
          "object" ||
        Array.isArray(result)
      ) {
        return this.appendStageError(
          summary,
          stageName,
          "invalid_stage_result",
          `The ${stageName} stage returned an invalid result.`,
          "invalid-result"
        );
      }

      return {
        ...summary,
        ...result
      };
    } catch (error) {
      console.error(
        `Ari deliberation stage error: ${stageName}`,
        error
      );

      return this.appendStageError(
        summary,
        stageName,
        error?.message ||
          String(error),
        error?.message ||
          String(error),
        "stage-error"
      );
    }
  },

  appendStageError(
    summary = {},
    stageName = "unknown",
    code = "stage_error",
    message = "Stage error.",
    source = "stage-error"
  ) {
    return {
      ...summary,

      [`${stageName}StageRan`]:
        false,

      [`${stageName}StageSource`]:
        source,

      [`${stageName}StageError`]:
        message,

      deliberationStageErrors:
        this.appendUniqueError(
          summary.deliberationStageErrors,
          {
            stage:
              stageName,
            error:
              code,
            message
          }
        )
    };
  },

  /* =====================================================
     DEBUG TRACE
  ===================================================== */

  initializeDeliberationDebugTrace(
    summary = {},
    startedAtMs = null
  ) {
    return {
      ...summary,

      deliberationDebugTrace: {
        schema:
          "ari.deliberation_debug_trace",
        schemaVersion:
          this.debugSchemaVersion,
        pipelineEntered:
          true,
        pipelineSource:
          this.source,
        pipelineVersion:
          this.version,
        architecture:
          this.architecture,
        enteredAt:
          new Date().toISOString(),
        startedAtMs:
          Number.isFinite(startedAtMs)
            ? startedAtMs
            : this.nowMs(),
        currentStage:
          "pipeline_entry",
        stages:
          [],
        failureBoundary:
          null,
        firstFailedStage:
          null,
        completed:
          false,
        ready:
          false,
        durationMs:
          null,
        inputSnapshot:
          this.buildDebugInputSnapshot(
            summary
          ),
        finalSnapshot:
          null
      }
    };
  },

  buildDebugInputSnapshot(
    summary = {}
  ) {
    const originalText =
      summary.currentTurn
        ?.originalText ||
      summary.originalUserMessage ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    const effectiveText =
      summary.currentTurn
        ?.effectiveText ||
      summary.effectiveUserMessage ||
      summary.resolvedUserQuestion ||
      summary.userMessage ||
      summary.message ||
      summary.input ||
      "";

    return {
      turnId:
        summary.currentTurn
          ?.turnId ||
        summary.turnId ||
        summary.requestId ||
        null,
      originalTextAvailable:
        Boolean(
          this.cleanText(
            originalText
          )
        ),
      effectiveTextAvailable:
        Boolean(
          this.cleanText(
            effectiveText
          )
        ),
      originalTextLength:
        this.cleanText(
          originalText
        ).length,
      effectiveTextLength:
        this.cleanText(
          effectiveText
        ).length,
      currentTurnWasResolved:
        summary.currentTurnWasResolved ===
        true,
      perceptionPipelineRan:
        summary.perceptionPipelineRan ===
        true,
      perceptionPipelineReady:
        summary.perceptionPipelineReady ===
        true,
      executiveRoutingPipelineRan:
        summary.executiveRoutingPipelineRan ===
        true,
      executiveRoutingPipelineReady:
        summary.executiveRoutingPipelineReady ===
          true ||
        summary.executivePacket
          ?.ready === true,
      evidencePacketAvailable:
        Boolean(
          summary.evidencePacket ||
          summary.perceptionPacket
            ?.evidencePacket
        ),
      perceptionPacketAvailable:
        Boolean(
          summary.perceptionPacket
        ),
      executivePacketAvailable:
        Boolean(
          summary.executivePacket
        ),
      routingContractAvailable:
        Boolean(
          summary.routingContract ||
          summary.executivePacket
            ?.routingContract
        ),
      priorDeliberationErrorCount:
        this.toArray(
          summary.deliberationStageErrors
        ).length
    };
  },

  beginDebugStage(
    summary = {},
    stageName = "unknown"
  ) {
    const trace =
      this.readObject(
        summary.deliberationDebugTrace
      ) || {
        stages: []
      };

    const startedAtMs =
      this.nowMs();

    const stageEntry = {
      stage:
        stageName,
      sequence:
        this.toArray(
          trace.stages
        ).length +
        1,
      started:
        true,
      completed:
        false,
      ready:
        null,
      startedAt:
        new Date().toISOString(),
      startedAtMs,
      completedAt:
        null,
      completedAtMs:
        null,
      durationMs:
        null,
      source:
        null,
      outputAvailable:
        false,
      error:
        null,
      diagnostics:
        null
    };

    return {
      ...summary,

      deliberationDebugTrace: {
        ...trace,
        currentStage:
          stageName,
        stages: [
          ...this.toArray(
            trace.stages
          ),
          stageEntry
        ]
      }
    };
  },

  completeDebugStage(
    summary = {},
    stageName = "unknown",
    details = {}
  ) {
    const trace =
      this.readObject(
        summary.deliberationDebugTrace
      ) || {
        stages: []
      };

    const stages =
      this.toArray(
        trace.stages
      );

    const index =
      [...stages]
        .map(
          item =>
            item?.stage
        )
        .lastIndexOf(
          stageName
        );

    const completedAtMs =
      this.nowMs();

    const nextStages =
      stages.map(
        (item, itemIndex) => {
          if (
            itemIndex !==
            index
          ) {
            return item;
          }

          return {
            ...item,
            completed:
              true,
            ready:
              details.ready ??
              null,
            completedAt:
              new Date().toISOString(),
            completedAtMs,
            durationMs:
              Number.isFinite(
                item.startedAtMs
              )
                ? Math.max(
                    0,
                    Math.round(
                      completedAtMs -
                      item.startedAtMs
                    )
                  )
                : null,
            source:
              details.source ||
              null,
            outputAvailable:
              details.outputAvailable ===
              true,
            error:
              details.error ||
              null,
            diagnostics:
              details.diagnostics ||
              null
          };
        }
      );

    return {
      ...summary,

      deliberationDebugTrace: {
        ...trace,
        currentStage:
          `${stageName}_complete`,
        stages:
          nextStages
      }
    };
  },

  readLatestDebugStage(
    summary = {},
    stageName = "unknown"
  ) {
    const stages =
      this.toArray(
        summary.deliberationDebugTrace
          ?.stages
      );

    for (
      let index =
        stages.length - 1;
      index >= 0;
      index -= 1
    ) {
      if (
        stages[index]
          ?.stage ===
        stageName
      ) {
        return stages[index];
      }
    }

    return null;
  },

  finalizeDeliberationDebugTrace(
    summary = {},
    pipelineStartedAtMs = null
  ) {
    const trace =
      this.readObject(
        summary.deliberationDebugTrace
      ) || {
        stages: []
      };

    const stages =
      this.toArray(
        trace.stages
      );

    const failedStage =
      stages.find(
        stage =>
          stage?.ready === false ||
          Boolean(stage?.error)
      ) ||
      null;

    const incompleteStage =
      stages.find(
        stage =>
          stage?.completed !== true
      ) ||
      null;

    const pipelineReady =
      summary.deliberationPipelineReady ===
      true;

    const startMs =
      Number.isFinite(
        pipelineStartedAtMs
      )
        ? pipelineStartedAtMs
        : trace.startedAtMs;

    let failureBoundary =
      null;

    if (!pipelineReady) {
      if (incompleteStage) {
        failureBoundary =
          `inside_deliberation:${incompleteStage.stage}:incomplete`;
      } else if (failedStage) {
        failureBoundary =
          `inside_deliberation:${failedStage.stage}`;
      } else {
        failureBoundary =
          "inside_deliberation:final_readiness";
      }
    }

    return {
      ...summary,

      deliberationDebugTrace: {
        ...trace,
        currentStage:
          "pipeline_complete",
        completed:
          true,
        ready:
          pipelineReady,
        completedAt:
          new Date().toISOString(),
        durationMs:
          Number.isFinite(startMs)
            ? Math.max(
                0,
                Math.round(
                  this.nowMs() -
                  startMs
                )
              )
            : null,
        failureBoundary,
        firstFailedStage:
          failedStage?.stage ||
          incompleteStage?.stage ||
          null,
        stages,
        finalSnapshot: {
          evidencePacketAvailable:
            Boolean(
              summary.evidencePacket ||
              summary.perceptionPacket
                ?.evidencePacket
            ),
          reasoningStageRan:
            summary.reasoningStageRan ===
            true,
          reasoningReady:
            summary.reasoningReady ===
            true,
          reasoningResultAvailable:
            Boolean(
              summary.cognitiveReasoningResult
            ),
          semanticFrameAvailable:
            Boolean(
              summary.semanticFrame
            ),
          semanticValidationStageRan:
            summary.semanticValidationStageRan ===
            true,
          semanticValidationAccepted:
            summary.semanticValidationAccepted ===
            true,
          validatedSemanticFrameAvailable:
            Boolean(
              summary.validatedSemanticFrame
            ),
          responsePlanningStageRan:
            summary.responsePlanningStageRan ===
            true,
          responsePlanAvailable:
            Boolean(
              this.resolveResponsePlan(
                summary
              )
            ),
          responsePlanUsable:
            this.isResponsePlanUsable(
              this.resolveResponsePlan(
                summary
              )
            ),
          deliberationPipelineRan:
            summary.deliberationPipelineRan ===
            true,
          deliberationPipelineReady:
            pipelineReady,
          stageErrorCount:
            this.toArray(
              summary.deliberationStageErrors
            ).length,
          diagnosticErrorCount:
            this.toArray(
              summary.deliberationDiagnostics
                ?.errors
            ).length
        }
      }
    };
  },

  emitDebugLog(
    runtime = {},
    event = "debug",
    payload = null
  ) {
    try {
      if (
        typeof runtime?.debug ===
        "function"
      ) {
        runtime.debug(
          "deliberation",
          event,
          payload
        );
      }

      if (
        runtime?.deliberationDebug ===
        true
      ) {
        console.log(
          `[ARI DELIBERATION DEBUG] ${event}`,
          payload
        );
      }
    } catch (error) {
      console.warn(
        "Ari deliberation debug logging failed:",
        error
      );
    }
  },

  resolveStageReady(
    summary = {},
    stageName = "unknown"
  ) {
    const explicitReady =
      summary[
        `${stageName}StageReady`
      ];

    if (
      explicitReady === true ||
      explicitReady === false
    ) {
      return explicitReady;
    }

    const ran =
      summary[
        `${stageName}StageRan`
      ];

    const error =
      summary[
        `${stageName}StageError`
      ];

    if (
      ran === false ||
      Boolean(error)
    ) {
      return false;
    }

    if (ran === true) {
      return true;
    }

    return null;
  },

  /* =====================================================
     REASONING NORMALIZATION
  ===================================================== */

  normalizeReasoningOutputs(
    summary = {}
  ) {
    const reasoningStagePacket =
      this.readObject(
        summary.reasoningStagePacket
      );

    const directReasoningResult =
      this.readObject(
        summary.cognitiveReasoningResult
      ) ||
      this.readObject(
        summary.reasoningResult
      ) ||
      this.readObject(
        summary.openAIReasoningResult
      );

    const nestedReasoningResult =
      this.readObject(
        reasoningStagePacket
          ?.cognitiveReasoningResult
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.reasoningResult
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.openAIReasoningResult
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.result
          ?.cognitiveReasoningResult
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.result
          ?.reasoningResult
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.result
      );

    const reasoningResult =
      directReasoningResult ||
      nestedReasoningResult ||
      null;

    const semanticFrame =
      this.readObject(
        reasoningResult
          ?.semanticFrame
      ) ||
      this.readObject(
        reasoningResult
          ?.result
          ?.semanticFrame
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.semanticFrame
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.result
          ?.semanticFrame
      ) ||
      this.readObject(
        summary.semanticFrame
      ) ||
      null;

    const responseRequirements =
      this.readObject(
        reasoningResult
          ?.responseRequirements
      ) ||
      this.readObject(
        reasoningResult
          ?.result
          ?.responseRequirements
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.responseRequirements
      ) ||
      this.readObject(
        summary.responseRequirements
      ) ||
      null;

    const responseStrategy =
      this.readObject(
        reasoningResult
          ?.responseStrategy
      ) ||
      this.readObject(
        reasoningResult
          ?.result
          ?.responseStrategy
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.responseStrategy
      ) ||
      this.readObject(
        summary.responseStrategy
      ) ||
      null;

    const executionMetadata =
      this.readObject(
        reasoningResult
          ?.executionMetadata
      ) ||
      this.readObject(
        reasoningResult
          ?.result
          ?.executionMetadata
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.executionMetadata
      ) ||
      this.readObject(
        summary.executionMetadata
      ) ||
      null;

    const evidenceReferences =
      this.firstArray(
        reasoningResult
          ?.evidenceReferences,
        reasoningResult
          ?.result
          ?.evidenceReferences,
        reasoningStagePacket
          ?.evidenceReferences,
        summary.evidenceReferences
      );

    const modelInvocation =
      this.readObject(
        reasoningResult
          ?.modelInvocation
      ) ||
      this.readObject(
        reasoningStagePacket
          ?.modelInvocation
      ) ||
      this.readObject(
        summary.modelInvocation
      ) ||
      null;

    const reasoningReady =
      this.resolveReasoningReady({
        reasoningResult,
        reasoningStagePacket,
        semanticFrame,
        modelInvocation
      });

    return {
      ...summary,
      reasoningStagePacket,
      cognitiveReasoningResult:
        reasoningResult,
      reasoningResult,
      semanticFrame,
      aiSemanticFrame:
        semanticFrame,
      responseRequirements,
      responseStrategy,
      executionMetadata,
      evidenceReferences,
      modelInvocation,
      reasoningPacketAvailable:
        Boolean(
          reasoningResult
        ),
      reasoningResultAvailable:
        Boolean(
          reasoningResult
        ),
      semanticFrameAvailable:
        Boolean(
          semanticFrame
        ),
      reasoningStageReady:
        reasoningReady,
      reasoningReady
    };
  },

  resolveReasoningReady({
    reasoningResult = null,
    reasoningStagePacket = null,
    semanticFrame = null,
    modelInvocation = null
  } = {}) {
    const explicitlyFailed =
      reasoningResult
        ?.ready === false ||
      reasoningResult
        ?.reasoningEngineReady === false ||
      reasoningStagePacket
        ?.ready === false ||
      reasoningStagePacket
        ?.reasoningStageReady === false ||
      modelInvocation
        ?.succeeded === false;

    if (explicitlyFailed) {
      return false;
    }

    const explicitlyReady =
      reasoningResult
        ?.ready === true ||
      reasoningResult
        ?.reasoningEngineReady === true ||
      reasoningStagePacket
        ?.ready === true ||
      reasoningStagePacket
        ?.reasoningStageReady === true;

    if (
      explicitlyReady &&
      Boolean(semanticFrame)
    ) {
      return true;
    }

    return Boolean(
      reasoningResult &&
      semanticFrame
    );
  },

  /* =====================================================
     SEMANTIC VALIDATION
  ===================================================== */

  async runSemanticValidationStage(
    summary = {},
    runtime = {}
  ) {
    const stage =
      window.AriSemanticValidationStage ||
      window.Ari?.semanticValidationStage ||
      null;

    if (
      stage &&
      typeof stage.run ===
        "function"
    ) {
      const result =
        await this.runStage(
          stage,
          summary,
          runtime,
          "semantic_validation"
        );

      return this.normalizeSemanticValidationOutputs(
        result
      );
    }

    const validator =
      window.AriSemanticFrameValidator ||
      window.Ari?.semanticFrameValidator ||
      null;

    if (
      !validator ||
      (
        typeof validator.validate !==
          "function" &&
        typeof validator.run !==
          "function"
      )
    ) {
      return this.appendStageError(
        summary,
        "semantic_validation",
        "semantic_frame_validator_not_loaded",
        "AriSemanticFrameValidator was not loaded.",
        "not-loaded"
      );
    }

    try {
      const validationInput = {
        semanticFrame:
          this.readObject(
            summary.semanticFrame
          ) ||
          this.readObject(
            summary.cognitiveReasoningResult
              ?.semanticFrame
          ) ||
          this.readObject(
            summary.reasoningStagePacket
              ?.semanticFrame
          ) ||
          this.readObject(
            summary.reasoningStagePacket
              ?.cognitiveReasoningResult
              ?.semanticFrame
          ) ||
          this.readObject(
            summary.reasoningStagePacket
              ?.reasoningResult
              ?.semanticFrame
          ) ||
          this.readObject(
            summary.reasoningStagePacket
              ?.result
              ?.semanticFrame
          ) ||
          this.readObject(
            summary.reasoningStagePacket
              ?.result
              ?.cognitiveReasoningResult
              ?.semanticFrame
          ) ||
          null,

        cognitiveReasoningResult:
          summary.cognitiveReasoningResult ||
          null,

        evidencePacket:
          summary.evidencePacket ||
          summary.perceptionPacket
            ?.evidencePacket ||
          null,

        operationRegistry:
          window.AriOperationRegistry ||
          window.Ari?.operationRegistry ||
          null,

        continuity:
          summary.continuityStagePacket ||
          summary.continuityResolution ||
          null,

        executionMetadata:
          summary.executionMetadata ||
          null,

        responseRequirements:
          summary.responseRequirements ||
          null
      };

this.emitDebugLog(
  runtime,
  "semantic_validation_input",
  {
    semanticFrameAvailable:
      Boolean(
        validationInput.semanticFrame
      ),

    semanticFrameType:
      Array.isArray(
        validationInput.semanticFrame
      )
        ? "array"
        : typeof validationInput
            .semanticFrame,

    semanticFrameKeys:
      validationInput.semanticFrame &&
      typeof validationInput
        .semanticFrame ===
        "object" &&
      !Array.isArray(
        validationInput.semanticFrame
      )
        ? Object.keys(
            validationInput.semanticFrame
          )
        : [],

    semanticFrameSchema:
      validationInput.semanticFrame
        ?.schema ||
      null,

    semanticFrameSchemaVersion:
      validationInput.semanticFrame
        ?.schemaVersion ||
      null,

    semanticFrameReady:
      validationInput.semanticFrame
        ?.ready ??
      null,

    semanticFrameValid:
      validationInput.semanticFrame
        ?.valid ??
      null,

    cognitiveReasoningResultAvailable:
      Boolean(
        validationInput
          .cognitiveReasoningResult
      ),

    cognitiveReasoningResultKeys:
      validationInput
        .cognitiveReasoningResult &&
      typeof validationInput
        .cognitiveReasoningResult ===
        "object" &&
      !Array.isArray(
        validationInput
          .cognitiveReasoningResult
      )
        ? Object.keys(
            validationInput
              .cognitiveReasoningResult
          )
        : [],

    evidencePacketAvailable:
      Boolean(
        validationInput.evidencePacket
      ),

    operationRegistryAvailable:
      Boolean(
        validationInput.operationRegistry
      ),

    continuityAvailable:
      Boolean(
        validationInput.continuity
      ),

    executionMetadataAvailable:
      Boolean(
        validationInput
          .executionMetadata
      ),

    responseRequirementsAvailable:
      Boolean(
        validationInput
          .responseRequirements
      ),

    validationInputKeys:
      Object.keys(
        validationInput
      )
  }
);

      const validateMethod =
        typeof validator.validate ===
          "function"
          ? validator.validate
          : validator.run;

      const result =
        await validateMethod.call(
          validator,
          validationInput,
          runtime
        );

this.emitDebugLog(
  runtime,
  "semantic_validation_output",
  {
    resultAvailable:
      Boolean(result),

    resultType:
      Array.isArray(result)
        ? "array"
        : typeof result,

    resultKeys:
      result &&
      typeof result ===
        "object" &&
      !Array.isArray(result)
        ? Object.keys(result)
        : [],

    ready:
      result?.ready ??
      null,

    valid:
      result?.valid ??
      null,

    accepted:
      result?.accepted ??
      null,

    status:
      result?.status ||
      null,

    semanticFrameValidatorReady:
      result
        ?.semanticFrameValidatorReady ??
      null,

    nestedValidationAvailable:
      Boolean(
        result
          ?.semanticFrameValidation
      ),

    nestedValidationKeys:
      result
        ?.semanticFrameValidation &&
      typeof result
        .semanticFrameValidation ===
        "object" &&
      !Array.isArray(
        result
          .semanticFrameValidation
      )
        ? Object.keys(
            result
              .semanticFrameValidation
          )
        : [],

    nestedReady:
      result
        ?.semanticFrameValidation
        ?.ready ??
      null,

    nestedValid:
      result
        ?.semanticFrameValidation
        ?.valid ??
      null,

    nestedAccepted:
      result
        ?.semanticFrameValidation
        ?.accepted ??
      null,

    nestedStatus:
      result
        ?.semanticFrameValidation
        ?.status ||
      null,

    validatedSemanticFrameAvailable:
      Boolean(
        result
          ?.validatedSemanticFrame ||
        result
          ?.semanticFrameValidation
          ?.validatedSemanticFrame
      ),

    semanticFrameReturned:
      Boolean(
        result?.semanticFrame ||
        result
          ?.semanticFrameValidation
          ?.semanticFrame
      ),

    errors:
      this.toArray(
        result?.errors
      ),

    nestedErrors:
      this.toArray(
        result
          ?.semanticFrameValidation
          ?.errors
      ),

    warnings:
      this.toArray(
        result?.warnings
      ),

    nestedWarnings:
      this.toArray(
        result
          ?.semanticFrameValidation
          ?.warnings
      )
  }
);

      if (
        !result ||
        typeof result !==
          "object" ||
        Array.isArray(result)
      ) {
        return this.appendStageError(
          summary,
          "semantic_validation",
          "invalid_validator_result",
          "AriSemanticFrameValidator returned an invalid result.",
          "invalid-result"
        );
      }

      return this.normalizeSemanticValidationOutputs({
        ...summary,
        semanticValidationStageRan:
          true,
        semanticValidationStageSource:
          result.source ||
          "ari-semantic-frame-validator",
        semanticValidationStagePacket:
          result,
        semanticFrameValidatorResult:
          result
      });
    } catch (error) {
      console.error(
        "Ari semantic validation error:",
        error
      );

      return this.appendStageError(
        summary,
        "semantic_validation",
        error?.message ||
          String(error),
        error?.message ||
          String(error),
        "stage-error"
      );
    }
  },

  normalizeSemanticValidationOutputs(
    summary = {}
  ) {
    const validation =
      this.readObject(
        summary.semanticFrameValidatorResult
      ) ||
      this.readObject(
        summary.semanticValidationStagePacket
      ) ||
      this.readObject(
        summary.semanticFrameValidation
      ) ||
      null;

    const nestedValidation =
      this.readObject(
        validation
          ?.semanticFrameValidation
      );

    const accepted =
      validation
        ?.semanticFrameValidatorReady === true ||
      validation
        ?.accepted === true ||
      validation
        ?.valid === true ||
      validation
        ?.status === "accepted" ||
      nestedValidation
        ?.accepted === true ||
      nestedValidation
        ?.valid === true ||
      nestedValidation
        ?.status === "accepted";

    const validatedSemanticFrame =
      accepted
        ? this.readObject(
            validation
              ?.validatedSemanticFrame
          ) ||
          this.readObject(
            nestedValidation
              ?.validatedSemanticFrame
          ) ||
          this.readObject(
            validation
              ?.semanticFrame
          ) ||
          this.readObject(
            nestedValidation
              ?.semanticFrame
          ) ||
          this.readObject(
            summary.validatedSemanticFrame
          ) ||
          this.readObject(
            summary.semanticFrame
          ) ||
          null
        : null;

    const compatibility =
      this.readObject(
        validation
          ?.semanticCompatibility
      ) ||
      this.readObject(
        nestedValidation
          ?.semanticCompatibility
      ) ||
      this.readObject(
        validation
          ?.compatibility
      ) ||
      this.readObject(
        validation
          ?.compatibilityProjections
      ) ||
      this.readObject(
        validation
          ?.projections
      ) ||
      null;

    const rejectedSemanticFrame =
      accepted
        ? null
        : this.readObject(
            validation
              ?.rejectedSemanticFrame
          ) ||
          this.readObject(
            nestedValidation
              ?.rejectedSemanticFrame
          ) ||
          this.readObject(
            summary.semanticFrame
          ) ||
          null;

    const validationErrors =
      this.firstArray(
        nestedValidation
          ?.errors,
        validation
          ?.errors,
        summary.semanticValidationErrors
      );

    const validationWarnings =
      this.firstArray(
        nestedValidation
          ?.warnings,
        validation
          ?.warnings,
        summary.semanticValidationWarnings
      );

    return {
      ...summary,
      semanticFrameValidatorResult:
        validation,
      semanticFrameValidation:
        nestedValidation ||
        validation,
      semanticValidationAccepted:
        accepted,
      semanticValidationRejected:
        !accepted,
      semanticValidationErrors:
        validationErrors,
      semanticValidationWarnings:
        validationWarnings,
      validatedSemanticFrame,
      rejectedSemanticFrame,
      semanticCompatibility:
        compatibility,
      canonicalMeaning:
        compatibility
          ?.canonicalMeaning ||
        null,
      primaryFrame:
        compatibility
          ?.primaryFrame ||
        validatedSemanticFrame ||
        null,
      semanticSummary:
        compatibility
          ?.semanticSummary ||
        validatedSemanticFrame
          ?.semanticSummary ||
        null,
      semanticSlots:
        compatibility
          ?.semanticSlots ||
        validatedSemanticFrame
          ?.slots ||
        null,
      validatedResponseRequirements:
        compatibility
          ?.responseRequirements ||
        validation
          ?.responseRequirements ||
        nestedValidation
          ?.responseRequirements ||
        summary.responseRequirements ||
        null
    };
  },

  isSemanticValidationAccepted(
    summary = {}
  ) {
    return (
      summary.semanticValidationAccepted ===
        true &&
      Boolean(
        summary.validatedSemanticFrame
      )
    );
  },

  /* =====================================================
     DIAGNOSTICS
  ===================================================== */

  buildDeliberationDiagnostics(
    summary = {}
  ) {
    const errors =
      this.dedupeErrors(
        summary.deliberationStageErrors
      );

    const warnings = [];

    const evidencePacket =
      this.readObject(
        summary.evidencePacket
      ) ||
      this.readObject(
        summary.perceptionPacket
          ?.evidencePacket
      ) ||
      null;

    const reasoningResult =
      this.readObject(
        summary.cognitiveReasoningResult
      );

    const semanticFrame =
      this.readObject(
        summary.semanticFrame
      );

    const reasoningReady =
      summary.reasoningReady ===
        true &&
      Boolean(reasoningResult) &&
      Boolean(semanticFrame);

    const validationAccepted =
      this.isSemanticValidationAccepted(
        summary
      );

    const responsePlan =
      this.resolveResponsePlan(
        summary
      );

    const responsePlanAvailable =
      this.isResponsePlanUsable(
        responsePlan
      );

    if (!evidencePacket) {
      errors.push({
        stage:
          "deliberation",
        error:
          "evidence_packet_missing"
      });
    }

    if (!reasoningResult) {
      errors.push({
        stage:
          "reasoning",
        error:
          "cognitive_reasoning_result_missing"
      });
    }

    if (
      reasoningResult &&
      summary.reasoningReady !==
        true
    ) {
      errors.push({
        stage:
          "reasoning",
        error:
          "cognitive_reasoning_result_not_ready"
      });
    }

    if (!semanticFrame) {
      errors.push({
        stage:
          "reasoning",
        error:
          "semantic_frame_missing"
      });
    }

    if (!validationAccepted) {
      errors.push({
        stage:
          "semantic_validation",
        error:
          "semantic_validation_not_accepted"
      });
    }

    if (
      validationAccepted &&
      !responsePlanAvailable
    ) {
      errors.push({
        stage:
          "response_planning",
        error:
          "response_plan_missing_or_unusable"
      });
    }

    const uniqueErrors =
      this.dedupeErrors(
        errors
      );

    const complete =
      uniqueErrors.length === 0 &&
      reasoningReady &&
      validationAccepted &&
      responsePlanAvailable;

    return {
      deliberationDiagnosticsRan:
        true,
      deliberationDiagnosticsVersion:
        this.version,
      healthy:
        uniqueErrors.length === 0,
      complete,
      ready:
        complete,
      errors:
        uniqueErrors,
      warnings,
      stages: {
        continuity:
          summary.continuityStageRan ===
          true,
        safety:
          summary.safetyStageRan ===
          true,
        situation:
          summary.situationStageRan ===
          true,
        memory:
          summary.memoryStageRan ===
          true,
        reasoning:
          reasoningReady,
        semanticValidation:
          validationAccepted,
        responsePlanning:
          summary.responsePlanningStageRan ===
            true &&
          responsePlanAvailable
      },
      contracts: {
        evidencePacketAvailable:
          Boolean(evidencePacket),
        reasoningResultAvailable:
          Boolean(reasoningResult),
        reasoningResultReady:
          reasoningReady,
        semanticFrameAvailable:
          Boolean(semanticFrame),
        validatedSemanticFrameAvailable:
          Boolean(
            summary.validatedSemanticFrame
          ),
        responseRequirementsAvailable:
          Boolean(
            summary.validatedResponseRequirements ||
            summary.responseRequirements
          ),
        responsePlanAvailable
      },
      modelInvocation:
        summary.modelInvocation ||
        reasoningResult
          ?.modelInvocation ||
        null,
      debugTraceAvailable:
        Boolean(
          summary.deliberationDebugTrace
        ),
      invariants: {
        openAIIsSoleSemanticAuthority:
          true,
        semanticFrameValidatedBeforePlanning:
          validationAccepted,
        responsePlanningBlockedOnValidationFailure:
          !responsePlanAvailable ||
          validationAccepted,
        localUnderstandingStageRemoved:
          true
      }
    };
  },

  /* =====================================================
     RESPONSE PLAN
  ===================================================== */

  resolveResponsePlan(
    summary = {}
  ) {
    const stagePacket =
      this.readObject(
        summary.responsePlanningStagePacket
      );

    return (
      this.readObject(
        summary.responsePlan
      ) ||
      this.readObject(
        stagePacket
          ?.responsePlan
      ) ||
      this.readObject(
        stagePacket
          ?.plan
      ) ||
      this.readObject(
        stagePacket
          ?.result
          ?.responsePlan
      ) ||
      this.readObject(
        stagePacket
          ?.result
          ?.plan
      ) ||
      null
    );
  },

  isResponsePlanUsable(
    responsePlan = null
  ) {
    if (
      !responsePlan ||
      typeof responsePlan !==
        "object" ||
      Array.isArray(responsePlan)
    ) {
      return false;
    }

    if (
      responsePlan.ready ===
        false ||
      responsePlan.valid ===
        false
    ) {
      return false;
    }

    const moves =
      responsePlan.responseMoves ||
      responsePlan.moves ||
      responsePlan.sequence ||
      [];

    return Boolean(
      responsePlan.ready ===
        true ||
      responsePlan.valid ===
        true ||
      this.cleanText(
        responsePlan.responseGoal ||
        responsePlan.goal
      ) ||
      (
        Array.isArray(moves) &&
        moves.length > 0
      )
    );
  },

  /* =====================================================
     DELIBERATION PACKET
  ===================================================== */

  buildDeliberationPacket(
    summary = {}
  ) {
    const diagnostics =
      summary.deliberationDiagnostics ||
      null;

    const evidencePacket =
      summary.evidencePacket ||
      summary.perceptionPacket
        ?.evidencePacket ||
      null;

    const reasoningResult =
      summary.cognitiveReasoningResult ||
      null;

    const validation =
      summary.semanticFrameValidatorResult ||
      summary.semanticFrameValidation ||
      null;

    const validatedSemanticFrame =
      summary.validatedSemanticFrame ||
      null;

    const responsePlan =
      this.resolveResponsePlan(
        summary
      );

    return {
      schema:
        "ari_deliberation_packet",
      schemaVersion:
        this.schemaVersion,
      ready:
        diagnostics
          ?.complete === true,
      source:
        this.source,
      version:
        this.version,
      architecture:
        this.architecture,
      inputs: {
        perceptionPacket:
          summary.perceptionPacket ||
          null,
        evidencePacket,
        executivePacket:
          summary.executivePacket ||
          null,
        routingContract:
          summary.routingContract ||
          summary.executivePacket
            ?.routingContract ||
          null
      },
      stages: {
        continuity:
          summary.continuityStagePacket ||
          null,
        safety:
          summary.safetyStagePacket ||
          null,
        situation:
          summary.situationStagePacket ||
          null,
        memory:
          summary.memoryStagePacket ||
          null,
        reasoning:
          summary.reasoningStagePacket ||
          reasoningResult,
        semanticValidation:
          summary.semanticValidationStagePacket ||
          validation,
        responsePlanning:
          summary.responsePlanningStagePacket ||
          null
      },
      request: {
        original:
          summary.currentTurn
            ?.originalText ||
          summary.originalUserMessage ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",
        effective:
          summary.currentTurn
            ?.effectiveText ||
          summary.effectiveUserMessage ||
          summary.resolvedUserQuestion ||
          summary.userMessage ||
          summary.message ||
          summary.input ||
          "",
        currentTurnWasResolved:
          summary.currentTurnWasResolved ===
          true
      },
      reasoning: {
        available:
          Boolean(reasoningResult),
        ready:
          summary.reasoningReady ===
          true,
        source:
          reasoningResult
            ?.source ||
          summary.reasoningStageSource ||
          null,
        model:
          reasoningResult
            ?.model ||
          reasoningResult
            ?.modelId ||
          summary.modelInvocation
            ?.model ||
          null,
        result:
          reasoningResult,
        modelInvocation:
          summary.modelInvocation ||
          reasoningResult
            ?.modelInvocation ||
          null,
        error:
          summary.reasoningStageError ||
          reasoningResult
            ?.error ||
          null,
        semanticFrame:
          summary.semanticFrame ||
          reasoningResult
            ?.semanticFrame ||
          null,
        responseRequirements:
          summary.responseRequirements ||
          reasoningResult
            ?.responseRequirements ||
          null,
        executionMetadata:
          summary.executionMetadata ||
          reasoningResult
            ?.executionMetadata ||
          null,
        evidenceReferences:
          summary.evidenceReferences ||
          reasoningResult
            ?.evidenceReferences ||
          []
      },
      semanticValidation: {
        available:
          Boolean(validation),
        accepted:
          summary.semanticValidationAccepted ===
          true,
        rejected:
          summary.semanticValidationRejected ===
          true,
        result:
          validation,
        validatedSemanticFrame,
        rejectedSemanticFrame:
          summary.rejectedSemanticFrame ||
          null,
        compatibility:
          summary.semanticCompatibility ||
          null,
        canonicalMeaning:
          summary.canonicalMeaning ||
          null,
        primaryFrame:
          summary.primaryFrame ||
          validatedSemanticFrame ||
          null,
        semanticSummary:
          summary.semanticSummary ||
          null,
        semanticSlots:
          summary.semanticSlots ||
          null,
        responseRequirements:
          summary.validatedResponseRequirements ||
          null
      },
      responsePlanning: {
        allowed:
          this.isSemanticValidationAccepted(
            summary
          ),
        ran:
          summary.responsePlanningStageRan ===
          true,
        packet:
          summary.responsePlanningStagePacket ||
          null,
        plan:
          responsePlan,
        ready:
          this.isResponsePlanUsable(
            responsePlan
          ),
        strategy:
          summary.responseStrategy ||
          null,
        communicationPlan:
          summary.communicationPlan ||
          null,
        composerDirective:
          summary.composerDirective ||
          null
      },
      diagnostics,
      debug: {
        available:
          Boolean(
            summary.deliberationDebugTrace
          ),
        trace:
          summary.deliberationDebugTrace ||
          null
      },
      authority: {
        canCoordinateDeterministicContext:
          true,
        canRunOpenAIReasoningStage:
          true,
        canRunSemanticValidation:
          true,
        canRunResponsePlanning:
          true,
        canPreserveEvidencePacket:
          true,
        canPreserveCognitiveReasoningResult:
          true,
        canPreserveValidatedSemanticFrame:
          true,
        canInterpretMeaningLocally:
          false,
        canConstructSemanticFrameLocally:
          false,
        canRepairSemanticFrame:
          false,
        canInventIntent:
          false,
        canInventUserGoal:
          false,
        canSelectOperationLocally:
          false,
        canBypassSemanticValidation:
          false,
        canPlanFromUnvalidatedMeaning:
          false,
        canChooseFinalRoute:
          false,
        canWriteFinalLanguage:
          false,
        canSelectFinalDraft:
          false,
        canPersistState:
          false,
        role:
          "deliberation_orchestration_openai_reasoning_validation_planning_and_debug_handoff"
      }
    };
  },

  /* =====================================================
     EXECUTIVE FALLBACK
  ===================================================== */

  buildFallbackExecutivePacket(
    summary = {}
  ) {
    return {
      ready:
        false,
      source:
        "ari-deliberation-pipeline-fallback",
      version:
        this.version,
      routingContract:
        summary.routingContract ||
        null,
      selectedRoute: {
        mode:
          summary.conversationMode ||
          "unknown",
        primaryIntent:
          "unresolved",
        domain:
          summary.conversationDomain ||
          "general",
        contextLane:
          summary.contextLane ||
          summary.lane ||
          "direct_current_turn",
        primaryLane:
          summary.primaryLane ||
          null,
        capabilities:
          summary.requiredCapabilities ||
          [],
        planner:
          summary.selectedPlanner ||
          null
      },
      runInstructions: {
        continuity:
          true,
        thread:
          summary.laneSplit
            ?.routing
            ?.useThread === true,
        memory:
          summary.laneSplit
            ?.routing
            ?.useMemory === true,
        relationship:
          summary.laneSplit
            ?.routing
            ?.useRelationship === true,
        deepSafety:
          true,
        situationMap:
          true,
        memoryRetrieval:
          true,
        openAIReasoning:
          true,
        semanticValidation:
          true,
        responsePlanning:
          true
      },
      authority: {
        canChooseRoute:
          false,
        canChooseSemanticIntent:
          false,
        canPerformSemanticReasoning:
          false,
        canConstructSemanticFrame:
          false,
        canWriteFinalLanguage:
          false,
        role:
          "compatibility_executive_fallback"
      }
    };
  },

  /* =====================================================
     VALIDATION
  ===================================================== */

  validate() {
    const required = {
      operationRegistry:
        Boolean(
          window.AriOperationRegistry ||
          window.Ari?.operationRegistry
        ),
      semanticFrameValidator:
        Boolean(
          window.AriSemanticFrameValidator ||
          window.Ari?.semanticFrameValidator
        ),
      reasoningStage:
        Boolean(
          window.AriReasoningStage ||
          window.AriOpenAIReasoningStage ||
          window.Ari?.reasoningStage ||
          window.Ari?.openAIReasoningStage
        ),
      responsePlanningStage:
        Boolean(
          window.AriResponsePlanningStage ||
          window.Ari?.responsePlanningStage
        )
    };

    const errors = [];
    const warnings = [];

    if (!required.semanticFrameValidator) {
      errors.push(
        "semantic_frame_validator_not_loaded"
      );
    }

    if (!required.operationRegistry) {
      warnings.push(
        "operation_registry_not_loaded"
      );
    }

    if (!required.reasoningStage) {
      warnings.push(
        "reasoning_stage_not_loaded"
      );
    }

    if (!required.responsePlanningStage) {
      warnings.push(
        "response_planning_stage_not_loaded"
      );
    }

    return {
      valid:
        errors.length === 0,
      ready:
        errors.length === 0 &&
        warnings.length === 0,
      source:
        "ari-deliberation-pipeline-validation",
      version:
        this.version,
      errors,
      warnings,
      required,
      checks: {
        localUnderstandingStageRemoved:
          true,
        openAIReasoningIsSemanticAuthority:
          true,
        validatorCannotInventMeaning:
          true,
        responsePlanningRequiresValidatedFrame:
          true,
        deliberationDebugTraceAvailable:
          typeof this.initializeDeliberationDebugTrace ===
          "function",
        stageBoundaryTracingAvailable:
          typeof this.runTracedStage ===
          "function"
      }
    };
  },

  /* =====================================================
     UTILITIES
  ===================================================== */

  readObject(value) {
    return (
      value &&
      typeof value ===
        "object" &&
      !Array.isArray(value)
    )
      ? value
      : null;
  },

  firstArray(...values) {
    for (const value of values) {
      if (Array.isArray(value)) {
        return [...value];
      }
    }

    return [];
  },

  appendUniqueError(
    existing = [],
    nextError = null
  ) {
    const errors =
      this.toArray(existing);

    if (
      !nextError ||
      typeof nextError !==
        "object"
    ) {
      return errors;
    }

    const duplicate =
      errors.some(
        item =>
          item?.stage ===
            nextError.stage &&
          item?.error ===
            nextError.error &&
          (item?.message || null) ===
            (nextError.message || null)
      );

    return duplicate
      ? errors
      : [
          ...errors,
          nextError
        ];
  },

  dedupeErrors(value = []) {
    const output = [];
    const seen =
      new Set();

    for (
      const item of this.toArray(
        value
      )
    ) {
      if (
        !item ||
        typeof item !==
          "object"
      ) {
        continue;
      }

      const key =
        [
          item.stage ||
            "unknown",
          item.error ||
            "unknown",
          item.message ||
            ""
        ].join("::");

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      output.push(item);
    }

    return output;
  },

  cleanText(value = "") {
    return String(
      value ??
      ""
    )
      .replace(
        /[ \t]+/g,
        " "
      )
      .replace(
        /\n[ \t]+/g,
        "\n"
      )
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();
  },

  toArray(value) {
    if (Array.isArray(value)) {
      return value.filter(
        item =>
          item !== undefined &&
          item !== null
      );
    }

    if (
      value === undefined ||
      value === null
    ) {
      return [];
    }

    return [value];
  },

  nowMs() {
    if (
      typeof performance !==
        "undefined" &&
      typeof performance.now ===
        "function"
    ) {
      return performance.now();
    }

    return Date.now();
  }
};

window.Ari.deliberationPipeline =
  window.AriDeliberationPipeline;

const ariDeliberationPipelineValidation =
  window.AriDeliberationPipeline
    ?.validate?.();

console.log(
  "ARI DELIBERATION PIPELINE LOADED:",
  window.AriDeliberationPipeline
    ?.version,
  ariDeliberationPipelineValidation
    ?.ready === true
    ? "READY"
    : ariDeliberationPipelineValidation
        ?.valid === true
      ? "VALID_BUT_DEPENDENCIES_MISSING"
      : "INVALID",
  ariDeliberationPipelineValidation
);
