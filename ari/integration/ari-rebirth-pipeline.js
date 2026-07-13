// ari/integration/ari-rebirth-pipeline.js
// Ari Rebirth Pipeline
// Purpose: Coordinate Ari's five-layer communication lifecycle.
// V5.1.0 — Canonical Thread Context + Structured Recent Turn Persistence

window.Ari = window.Ari || {};

window.AriRebirthPipeline = {
  version: "5.1.0",

  async run(systemSummary = {}) {
    const debugTiming =
      systemSummary.debugTiming === true ||
      systemSummary.appContext?.debugTiming === true;

    const timingStart =
      performance.now();

    const timing = [];

    let summary = {
      ...this.normalizeInput(
        systemSummary
      ),

      debugTiming,

      pipelineTiming:
        timing,

      pipelineTimingStart:
        timingStart,

      pipelineLifecycleErrors:
        []
    };

    const mark = label => {
      if (!debugTiming) {
        return;
      }

      timing.push({
        label,

        ms:
          Math.round(
            performance.now() -
            timingStart
          )
      });

      summary.pipelineTiming =
        timing;
    };

    const finishTiming = () => {
      if (!debugTiming) {
        return;
      }

      mark(
        "AriRebirthPipeline.run complete"
      );

      console.table(
        timing
      );

      console.log(
        "[AriRebirthPipeline Timing] Total:",
        `${Math.round(
          performance.now() -
          timingStart
        )}ms`
      );
    };

    const runEngine = async (
      engine,
      methods = [],
      fallback = {},
      inputState = summary
    ) => {
      if (!engine) {
        return fallback;
      }

      for (
        const method
        of methods
      ) {
        if (
          typeof engine[method] !==
          "function"
        ) {
          continue;
        }

        try {
          const result =
            await engine[method](
              inputState
            );

          return result ||
            fallback;
        } catch (error) {
          console.error(
            "Ari pipeline engine error:",
            method,
            error
          );

          return {
            ...fallback,

            error:
              error?.message ||
              String(error),

            failedMethod:
              method,

            engineVersion:
              engine?.version ||
              null
          };
        }
      }

      return fallback;
    };

    mark(
      "normalizeInput complete"
    );

    mark(
      "before loadThreadState"
    );

    summary =
      await this.loadThreadState(
        summary
      );

    mark(
      "after loadThreadState"
    );

    summary =
      this.preserveDeveloperEvidence(
        summary
      );

    summary =
      this.preserveMealEstimate(
        summary
      );

    const layerRuntime = {
      mark,

      runEngine,

      preserveDeveloperEvidence:
        state =>
          this.preserveDeveloperEvidence(
            state
          ),

      preserveMealEstimate:
        state =>
          this.preserveMealEstimate(
            state
          ),

      runDeveloperLayer:
        state =>
          this.runDeveloperLayer(
            state
          ),

      applyContractBridge:
        state =>
          this.applyContractBridge(
            state
          ),

      buildFallbackComposerPacket:
        state =>
          this.buildFallbackComposerPacket(
            state
          ),

      saveFinalThreadState:
        state =>
          this.saveFinalThreadState(
            state
          ),

      saveAriConversationHistory:
        state =>
          this.saveAriConversationHistory(
            state
          ),

      addCandidateDraft:
        (
          existing,
          candidate
        ) =>
          this.addCandidateDraft(
            existing,
            candidate
          ),

      isUsableBlueprintDraft:
        (
          draft,
          state
        ) =>
          this.isUsableBlueprintDraft(
            draft,
            state
          )
    };

    const layers = [
      {
        name:
          "perception",

        label:
          "perceptionPipeline",

        pipeline:
          window.AriPerceptionPipeline
      },

      {
        name:
          "executiveRouting",

        label:
          "executiveRoutingPipeline",

        pipeline:
          window.AriExecutiveRoutingPipeline
      },

      {
        name:
          "deliberation",

        label:
          "deliberationPipeline",

        pipeline:
          window.AriDeliberationPipeline
      },

      {
        name:
          "expression",

        label:
          "expressionPipeline",

        pipeline:
          window.AriExpressionPipeline
      },

      {
        name:
          "delivery",

        label:
          "deliveryPipeline",

        pipeline:
          window.AriDeliveryPipeline
      }
    ];

    for (
      const layer
      of layers
    ) {
      mark(
        `before ${layer.label}`
      );

      summary =
        await this.runPipelineLayer({
          name:
            layer.name,

          pipeline:
            layer.pipeline,

          summary,

          runtime:
            layerRuntime
        });

      mark(
        `after ${layer.label}`
      );
    }

    summary = {
      ...summary,

      rebirthPipelineRan:
        true,

      rebirthPipelineSource:
        "ari-rebirth-pipeline",

      rebirthPipelineVersion:
        this.version,

      pipelineArchitecture:
        "five-layer",

      pipelineLayers: {
        perception:
          summary
            .perceptionPipelineRan ===
          true,

        executiveRouting:
          summary
            .executiveRoutingPipelineRan ===
          true,

        deliberation:
          summary
            .deliberationPipelineRan ===
          true,

        expression:
          summary
            .expressionPipelineRan ===
          true,

        delivery:
          summary
            .deliveryPipelineRan ===
          true
      }
    };

    summary.pipelineLifecycleComplete =
      Object.values(
        summary.pipelineLayers
      ).every(Boolean);

    this.debugLog(
      summary
    );

    finishTiming();

    summary.pipelineTiming =
      timing;

    summary.pipelineTimingStart =
      timingStart;

    return summary;
  },

  async runPipelineLayer({
    name = "unknown",
    pipeline = null,
    summary = {},
    runtime = {}
  } = {}) {
    if (
      !pipeline ||
      typeof pipeline.run !==
        "function"
    ) {
      const error = {
        layer:
          name,

        error:
          "pipeline_not_loaded",

        message:
          `The ${name} pipeline was not loaded.`
      };

      console.error(
        "Ari pipeline layer missing:",
        error
      );

      return {
        ...summary,

        [`${name}PipelineRan`]:
          false,

        [`${name}PipelineSource`]:
          "not-loaded",

        [`${name}PipelineError`]:
          error.message,

        pipelineLifecycleErrors: [
          ...(
            summary
              .pipelineLifecycleErrors ||
            []
          ),

          error
        ]
      };
    }

    try {
      const result =
        await pipeline.run(
          summary,
          runtime
        );

      if (
        !result ||
        typeof result !==
          "object"
      ) {
        const error = {
          layer:
            name,

          error:
            "invalid_pipeline_result",

          message:
            `The ${name} pipeline returned an invalid result.`
        };

        return {
          ...summary,

          [`${name}PipelineRan`]:
            false,

          [`${name}PipelineSource`]:
            "invalid-result",

          [`${name}PipelineError`]:
            error.message,

          pipelineLifecycleErrors: [
            ...(
              summary
                .pipelineLifecycleErrors ||
              []
            ),

            error
          ]
        };
      }

      return {
        ...result,

        pipelineLifecycleErrors:
          result
            .pipelineLifecycleErrors ||
          summary
            .pipelineLifecycleErrors ||
          []
      };
    } catch (error) {
      console.error(
        `Ari ${name} pipeline error:`,
        error
      );

      return {
        ...summary,

        [`${name}PipelineRan`]:
          false,

        [`${name}PipelineSource`]:
          "pipeline-error",

        [`${name}PipelineError`]:
          error?.message ||
          String(error),

        pipelineLifecycleErrors: [
          ...(
            summary
              .pipelineLifecycleErrors ||
            []
          ),

          {
            layer:
              name,

            error:
              "pipeline_execution_failed",

            message:
              error?.message ||
              String(error)
          }
        ]
      };
    }
  },

  normalizeInput(
    systemSummary = {}
  ) {
    const userMessage =
      systemSummary.userMessage ||
      systemSummary.message ||
      systemSummary.normalizedMessage ||
      systemSummary.input ||
      "";

    return {
      ...systemSummary,

      userMessage,

      message:
        userMessage,

      input:
        userMessage,

      normalizedMessage:
        String(
          userMessage
        )
          .toLowerCase()
          .trim()
    };
  },

  preserveDeveloperEvidence(
    summary = {}
  ) {
    const githubFileContext =
      summary.githubFileContext ||
      summary.appContext
        ?.githubFileContext ||
      null;

    const developerInvestigation =
      summary.developerInvestigation ||
      summary.appContext
        ?.developerInvestigation ||
      null;

    return {
      ...summary,

      githubFileContext,

      developerInvestigation,

      githubEvidenceAvailable:
        Boolean(
          githubFileContext
            ?.content
        ),

      githubEvidence:
        githubFileContext
          ?.content
          ? {
              filePath:
                githubFileContext
                  .filePath ||
                "unknown",

              content:
                githubFileContext
                  .content,

              contentLength:
                githubFileContext
                  .content
                  .length,

              contentPreview:
                githubFileContext
                  .content
                  .slice(
                    0,
                    5000
                  )
            }
          : null
    };
  },

  preserveMealEstimate(
    summary = {}
  ) {
    const text =
      String(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const wantsMealLog =
      /\b(log|add|save|track)\b/i
        .test(
          text
        );

    const newMealEstimate =
      summary.mealEstimate ||
      summary.aiData
        ?.mealEstimate ||
      summary.aiData
        ?.rawOpenAIData
        ?.mealEstimate ||
      summary.aiData
        ?.rawOpenAIData
        ?.response
        ?.mealEstimate ||
      summary.structuredOutput
        ?.mealEstimate ||
      summary.rawOpenAIData
        ?.mealEstimate ||
      summary.rawOpenAIData
        ?.response
        ?.mealEstimate ||
      summary.response
        ?.mealEstimate ||
      null;

    const priorMealEstimate =
      wantsMealLog
        ? (
            summary.lastMealEstimate ||
            summary.appContext
              ?.lastMealEstimate ||
            summary.threadState
              ?.lastMealEstimate ||
            null
          )
        : null;

    const mealEstimate =
      newMealEstimate ||
      priorMealEstimate;

    if (!mealEstimate) {
      return summary;
    }

    return {
      ...summary,

      mealEstimate,

      lastMealEstimate:
        mealEstimate,

      appContext: {
        ...(
          summary.appContext ||
          {}
        ),

        lastMealEstimate:
          mealEstimate,

        mealEstimate
      }
    };
  },

  buildFallbackComposerPacket(
    summary = {}
  ) {
    return {
      ready:
        true,

      source:
        "ari-rebirth-pipeline-fallback",

      version:
        this.version,

      userQuestion:
        summary.resolvedUserQuestion ||
        summary.threadQuestion
          ?.resolvedUserQuestion ||
        summary.userMessage ||
        summary.message ||
        summary.input ||
        "",

      primary:
        summary
          .situationContractPrimary ||
        summary.primaryLane ||
        "general_understanding",

      contextLane:
        summary.contextLane ||
        summary.lane ||
        "direct_current_turn",

      responseShape:
        summary.responseShape ||
        summary.mouthResponsePattern ||
        "clear_explanation",

      responseGoal:
        summary.responseGoal ||
        null,

      responseOrder:
        summary.responseOrder ||
        [],

      responseRules:
        summary.responseRules ||
        summary.responseConstraints ||
        [],

      responseConstraints:
        summary.responseConstraints ||
        [],

      requiredBehaviors:
        summary.responseRequired ||
        [],

      forbiddenBehaviors:
        summary.responseAvoid ||
        [],

      responseAvoid:
        summary.responseAvoid ||
        [],

      responseRequired:
        summary.responseRequired ||
        [],

      expressionPlan:
        summary.expressionPlan ||
        null,

      blueprintHint:
        summary.blueprintHint ||
        null,

      mouthDirective:
        summary.situationContract
          ?.mouthDirective ||
        summary.mouthDirective ||
        summary.mouthDirector ||
        null,

      meaningInterpretation:
        summary
          .meaningInterpretation ||
        null,

      humanState:
        summary.humanState ||
        null,

      responsePlan:
        summary.ariResponsePlan ||
        summary
          .understandingResponsePlan ||
        summary.responsePlan ||
        null,

      responseStrategy:
        summary.responseStrategy ||
        null,

      communicationPlan:
        summary.communicationPlan ||
        null,

      composerDirective:
        summary.composerDirective ||
        null,

      humanLanguageProfile:
        summary
          .humanLanguageProfile ||
        {},

      thesis: {
        value:
          summary
            .primarySituationThesis ||
          null,

        narrative:
          summary
            .situationNarrative ||
          null,

        recommendedUse:
          summary
            .thesisRecommendedUse ||
          "do_not_use_as_authority"
      },

      safety: {
        gate:
          summary
            .safetyContextGate ||
          null,

        deepReview:
          summary.deepSafetyResult ||
          null,

        disposition:
          summary
            .safetyDisposition ||
          null,

        risk:
          summary
            .situationContract
            ?.risk ||
          null,

        clarity:
          summary
            .situationContract
            ?.clarity ||
          null
      },

      developerPacket:
        summary
          .composerDeveloperPacket ||
        null,

      character:
        summary.composerCharacter ||
        summary.characterHandoff ||
        summary.characterExpression
          ?.composerCharacter ||
        summary.characterExpression
          ?.composerCharacterPacket ||
        null,

      languageGuidance:
        summary
          .languageGuidanceHandoff ||
        null,

      hasDeveloperPacket:
        summary
          .composerDeveloperPacket
          ?.enabled ===
        true,

      perceptionPacket:
        summary.perceptionPacket ||
        null,

      executivePacket:
        summary.executivePacket ||
        null,

      deliberationPacket:
        summary
          .deliberationPacket ||
        null,

      evidence: {
        github:
          summary.githubEvidence ||
          null,

        developerPacket:
          summary
            .composerDeveloperPacket ||
          null,

        developerHandoff:
          summary.developerHandoff ||
          summary
            .unlockedDeveloperHandoff ||
          null,

        developerResponse:
          summary.developerResponse ||
          null,

        developerReply:
          summary.developerReply ||
          null,

        memory: {
          retrieval:
            summary
              .memoryRetrieval ||
            null,

          context:
            summary.memoryContext ||
            null,

          facts:
            summary.memoryFacts ||
            summary.usableMemories ||
            []
        },

        aiWriter: {
          ran:
            summary.aiWriterRan ===
            true,

          usedAI:
            summary
              .aiWriterUsedAI ===
            true,

          draft:
            summary.aiWriterDraft ||
            null,

          source:
            summary.aiWriterSource ||
            null,

          version:
            summary.aiWriterVersion ||
            null,

          fallbackReason:
            summary
              .aiWriterFallbackReason ||
            null
        },

        reasoning:
          summary.reasoning ||
          null,

        lexicalGrounding:
          summary
            .lexicalGrounding ||
          null,

        continuityFacts:
          summary
            .continuityUsableFacts ||
          []
      }
    };
  },

  /* =====================================================
     THREAD STATE LOADING
  ===================================================== */

  async loadThreadState(
    summary = {}
  ) {
    const store =
      window.AriThreadStore;

    if (!store) {
      return {
        ...summary,

        threadStateLoaded:
          false,

        threadStateLoadReason:
          "thread_store_not_available"
      };
    }

    try {
      const threadState =
        typeof store.load ===
          "function"
          ? await store.load()
          : typeof store.get ===
              "function"
            ? await store.get()
            : typeof store.read ===
                "function"
              ? await store.read()
              : null;

      if (!threadState) {
        return {
          ...summary,

          threadStateLoaded:
            false,

          threadStateLoadReason:
            "no_thread_state_found"
        };
      }

      const recentTurns =
        this.normalizeStoredRecentTurns(
          threadState
        );

      const userTurns =
        recentTurns.filter(
          turn =>
            turn.role ===
            "user"
        );

      const assistantTurns =
        recentTurns.filter(
          turn =>
            turn.role ===
              "assistant" ||
            turn.role ===
              "ari"
        );

      const immediatePreviousUserTurn =
        userTurns.length
          ? userTurns[
              userTurns.length -
              1
            ]
          : null;

      const immediatePreviousAssistantTurn =
        assistantTurns.length
          ? assistantTurns[
              assistantTurns.length -
              1
            ]
          : null;

      const threadContext = {
        schema:
          "ari_thread_context",

        schemaVersion:
          "1.0.0",

        source:
          "ari-rebirth-pipeline-thread-loader",

        version:
          this.version,

        ran:
          true,

        available:
          true,

        currentTopic:
          this.normalizeTopicValue(
            threadState.currentTopic
          ),

        activeTopic:
          this.normalizeTopicValue(
            threadState.currentTopic
          ),

        activeSubject:
          threadState.activeSubject ||
          null,

        activeIssue:
          threadState.activeIssue ||
          null,

        activeGoal:
          threadState.activeGoal ||
          null,

        previousAnswer:
          threadState
            .previousAnswerSummary ||
          threadState
            .lastFinalResponse ||
          immediatePreviousAssistantTurn
            ?.text ||
          null,

        previousAnswerSummary:
          threadState
            .previousAnswerSummary ||
          null,

        lastFinalResponse:
          threadState
            .lastFinalResponse ||
          null,

        immediatePreviousUserTurn,

        immediatePreviousAssistantTurn,

        recentTurns,

        recentMessages:
          recentTurns,

        lastMessages:
          recentTurns
            .filter(
              turn =>
                turn.role ===
                "user"
            )
            .map(
              turn =>
                turn.text
            ),

        continuitySummary:
          threadState
            .continuitySummary ||
          null,

        workingContext:
          this.buildLoadedWorkingContext({
            threadState,
            recentTurns,
            immediatePreviousUserTurn,
            immediatePreviousAssistantTurn
          }),

        activeClaims:
          this.arrayFrom(
            threadState.activeClaims
          ),

        activeEntities:
          this.arrayFrom(
            threadState.activeEntities
          ),

        activeEvents:
          this.arrayFrom(
            threadState.activeEvents
          ),

        activeRelations:
          this.arrayFrom(
            threadState.activeRelations
          ),

        activeConstraints:
          this.arrayFrom(
            threadState.activeConstraints
          ),

        unresolvedItems:
          this.arrayFrom(
            threadState.unresolvedItems
          ),

        openLoops:
          this.arrayFrom(
            threadState
              .conversationMeaningOpenLoops
          ),

        topicHistory:
          this.arrayFrom(
            threadState.topicHistory
          ),

        conversationMeaningHistory:
          this.arrayFrom(
            threadState
              .conversationMeaningHistory
          ),

        latestConversationMeaning:
          threadState
            .latestConversationMeaning ||
          null,

        activeSemanticTimeline:
          this.arrayFrom(
            threadState
              .activeSemanticTimeline
          ),

        activeSemanticFrame:
          threadState
            .activeSemanticFrame ||
          null,

        conversationMeaningFocus:
          threadState
            .conversationMeaningFocus ||
          null,

        conversationMeaningOpenLoops:
          this.arrayFrom(
            threadState
              .conversationMeaningOpenLoops
          ),

        lastUpdatedAt:
          threadState
            .lastUpdatedAt ||
          null,

        referenceCandidates:
          this.buildThreadReferenceCandidates({
            threadState,
            recentTurns
          }),

        confidence:
          recentTurns.length
            ? 0.9
            : 0.65,

        authority: {
          canProvideStoredThreadContext:
            true,

          canPreserveRecentTurns:
            true,

          canChooseCurrentMeaning:
            false,

          canChooseRequestedOperation:
            false,

          canChooseRoute:
            false,

          canAnswerUser:
            false,

          role:
            "persisted_thread_context_only"
        }
      };

      return {
        ...summary,

        threadStateLoaded:
          true,

        threadState,

        threadContext,

        currentThreadContext:
          threadContext,

        recentTurns,

        recentMessages:
          recentTurns,

        immediatePreviousUserTurn,

        immediatePreviousAssistantTurn,

        workingContext:
          threadContext
            .workingContext,

        activeTopic:
          threadContext
            .activeTopic,

        activeSubject:
          threadContext
            .activeSubject ||
          summary.activeSubject ||
          null,

        activeIssue:
          threadContext
            .activeIssue ||
          summary.activeIssue ||
          null,

        activeGoal:
          threadContext
            .activeGoal ||
          summary.activeGoal ||
          null,

        previousAnswerSummary:
          threadContext
            .previousAnswerSummary ||
          null,

        conversationMeaningHistory:
          threadContext
            .conversationMeaningHistory,

        latestConversationMeaning:
          threadContext
            .latestConversationMeaning,

        activeSemanticTimeline:
          threadContext
            .activeSemanticTimeline,

        activeSemanticFrame:
          threadContext
            .activeSemanticFrame,

        conversationMeaningFocus:
          threadContext
            .conversationMeaningFocus,

        conversationMeaningOpenLoops:
          threadContext
            .conversationMeaningOpenLoops,

        lastMealEstimate:
          threadState
            .lastMealEstimate ||
          null,

        mealEstimate:
          summary.mealEstimate ||
          null,

        priorMeaningForFollowUp:
          threadState
            .latestConversationMeaning ||
          null
      };
    } catch (error) {
      return {
        ...summary,

        threadStateLoaded:
          false,

        threadStateLoadReason:
          "thread_store_load_failed",

        threadStateLoadError:
          error?.message ||
          String(error)
      };
    }
  },

  normalizeStoredRecentTurns(
    threadState = {}
  ) {
    const storedRecentTurns =
      Array.isArray(
        threadState.recentTurns
      )
        ? threadState.recentTurns
        : [];

    const normalizedStoredTurns =
      storedRecentTurns
        .map(
          (
            turn,
            index
          ) =>
            this.normalizeTurnRecord(
              turn,
              index
            )
        )
        .filter(Boolean);

    if (
      normalizedStoredTurns.length
    ) {
      return this.dedupeRecentTurns(
        normalizedStoredTurns
      ).slice(-12);
    }

    const legacyMessages =
      Array.isArray(
        threadState.lastMessages
      )
        ? threadState.lastMessages
        : [];

    const migratedTurns =
      legacyMessages
        .map(
          (
            message,
            index
          ) => {
            if (
              message &&
              typeof message ===
                "object"
            ) {
              return this.normalizeTurnRecord(
                message,
                index
              );
            }

            const text =
              this.cleanText(
                message
              );

            if (!text) {
              return null;
            }

            return {
              id:
                null,

              role:
                "user",

              text,

              createdAt:
                null,

              migratedFromLegacy:
                true,

              index
            };
          }
        )
        .filter(Boolean);

    const previousAnswer =
      this.cleanText(
        threadState
          .lastFinalResponse ||
        threadState
          .previousAnswerSummary ||
        ""
      );

    if (
      previousAnswer &&
      !migratedTurns.some(
        turn =>
          (
            turn.role ===
              "assistant" ||
            turn.role ===
              "ari"
          ) &&
          turn.text ===
            previousAnswer
      )
    ) {
      migratedTurns.push({
        id:
          null,

        role:
          "assistant",

        text:
          previousAnswer,

        createdAt:
          threadState
            .lastUpdatedAt ||
          null,

        migratedFromLegacy:
          true,

        index:
          migratedTurns.length
      });
    }

    return this.dedupeRecentTurns(
      migratedTurns
    ).slice(-12);
  },

  normalizeTurnRecord(
    turn = null,
    index = 0
  ) {
    if (
      turn === null ||
      turn === undefined
    ) {
      return null;
    }

    if (
      typeof turn ===
      "string"
    ) {
      const text =
        this.cleanText(
          turn
        );

      if (!text) {
        return null;
      }

      return {
        id:
          null,

        role:
          "unknown",

        text,

        createdAt:
          null,

        index
      };
    }

    const text =
      this.cleanText(
        turn.text ||
        turn.content ||
        turn.message ||
        turn.claim ||
        turn.value ||
        ""
      );

    if (!text) {
      return null;
    }

    return {
      id:
        turn.id ||
        turn.turnId ||
        turn.messageId ||
        null,

      role:
        this.normalizeTurnRole(
          turn.role
        ),

      text,

      createdAt:
        turn.createdAt ||
        turn.created_at ||
        turn.timestamp ||
        turn.updatedAt ||
        null,

      topic:
        turn.topic ||
        turn.activeTopic ||
        turn.situationFrame ||
        null,

      semanticMeaning:
        turn.semanticMeaning ||
        turn.meaning ||
        null,

      emotionalState:
        turn.emotionalState ||
        turn.emotion ||
        null,

      index
    };
  },

  normalizeTurnRole(
    role = ""
  ) {
    const normalized =
      String(
        role ||
        ""
      )
        .toLowerCase()
        .trim();

    if (
      normalized ===
        "assistant" ||
      normalized ===
        "ari" ||
      normalized ===
        "ai"
    ) {
      return "assistant";
    }

    if (
      normalized ===
        "user" ||
      normalized ===
        "human"
    ) {
      return "user";
    }

    if (
      normalized ===
      "system"
    ) {
      return "system";
    }

    return "unknown";
  },

  dedupeRecentTurns(
    turns = []
  ) {
    const seen =
      new Set();

    return this.arrayFrom(
      turns
    ).filter(
      turn => {
        if (
          !turn ||
          !turn.text
        ) {
          return false;
        }

        const key =
          [
            turn.role ||
            "unknown",

            this.cleanText(
              turn.text
            )
              .toLowerCase()
          ].join("|");

        if (
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      }
    );
  },

  buildLoadedWorkingContext({
    threadState = {},
    recentTurns = [],
    immediatePreviousUserTurn = null,
    immediatePreviousAssistantTurn = null
  } = {}) {
    return {
      summary:
        threadState
          .continuitySummary ||
        null,

      activeTopic:
        this.normalizeTopicValue(
          threadState.currentTopic
        ),

      activeSubject:
        threadState.activeSubject ||
        null,

      activeIssue:
        threadState.activeIssue ||
        null,

      activeGoal:
        threadState.activeGoal ||
        null,

      immediatePreviousUserTurn,

      immediatePreviousAssistantTurn,

      recentTurns,

      keyFacts: [
        ...this.arrayFrom(
          threadState.activeClaims
        ),

        ...this.arrayFrom(
          threadState
            .conversationMeaningFocus
        )
      ],

      openLoops:
        this.arrayFrom(
          threadState
            .conversationMeaningOpenLoops
        ),

      constraints:
        this.arrayFrom(
          threadState
            .activeConstraints
        ),

      unresolvedItems:
        this.arrayFrom(
          threadState
            .unresolvedItems
        ),

      authority:
        "persisted_working_context_only"
    };
  },

  buildThreadReferenceCandidates({
    threadState = {},
    recentTurns = []
  } = {}) {
    const candidates = [];

    const addCandidate = ({
      id = null,
      semanticRef = null,
      semanticType = "claim",
      value = null,
      source = "thread_state",
      turnDistance = 1,
      confidence = 0.7
    } = {}) => {
      const label =
        this.extractContextLabel(
          value
        );

      if (!label) {
        return;
      }

      candidates.push({
        id:
          id ||
          semanticRef ||
          null,

        semanticRef:
          semanticRef ||
          id ||
          null,

        semanticType,

        value,

        label,

        source,

        turnDistance,

        confidence
      });
    };

    addCandidate({
      semanticRef:
        "thread_current_topic",

      semanticType:
        "topic",

      value:
        threadState.currentTopic,

      source:
        "thread_state.currentTopic",

      confidence:
        0.85
    });

    addCandidate({
      semanticRef:
        "thread_active_subject",

      semanticType:
        "entity",

      value:
        threadState.activeSubject,

      source:
        "thread_state.activeSubject",

      confidence:
        0.82
    });

    addCandidate({
      semanticRef:
        "thread_active_issue",

      semanticType:
        "claim",

      value:
        threadState.activeIssue,

      source:
        "thread_state.activeIssue",

      confidence:
        0.82
    });

    addCandidate({
      semanticRef:
        "thread_active_goal",

      semanticType:
        "claim",

      value:
        threadState.activeGoal,

      source:
        "thread_state.activeGoal",

      confidence:
        0.78
    });

    this.arrayFrom(
      threadState.activeEntities
    ).forEach(
      (
        entity,
        index
      ) => {
        addCandidate({
          id:
            entity?.id ||
            `thread_entity_${index}`,

          semanticRef:
            entity?.semanticRef ||
            entity?.entityRef ||
            entity?.id ||
            `thread_entity_${index}`,

          semanticType:
            entity?.semanticType ||
            entity?.entityType ||
            entity?.type ||
            "entity",

          value:
            entity,

          source:
            "thread_state.activeEntities",

          confidence:
            entity?.confidence ??
            0.75
        });
      }
    );

    this.arrayFrom(
      threadState.activeClaims
    ).forEach(
      (
        claim,
        index
      ) => {
        addCandidate({
          id:
            claim?.id ||
            `thread_claim_${index}`,

          semanticRef:
            claim?.semanticRef ||
            claim?.id ||
            `thread_claim_${index}`,

          semanticType:
            "claim",

          value:
            claim,

          source:
            "thread_state.activeClaims",

          confidence:
            claim?.confidence ??
            0.72
        });
      }
    );

    recentTurns
      .slice(-6)
      .forEach(
        (
          turn,
          index,
          collection
        ) => {
          const turnDistance =
            collection.length -
            index;

          addCandidate({
            id:
              turn.id ||
              `thread_turn_${index}`,

            semanticRef:
              turn.id ||
              `thread_turn_${index}`,

            semanticType:
              "claim",

            value:
              turn.text,

            source:
              `recent_turn.${turn.role}`,

            turnDistance,

            confidence:
              turn.role ===
                "user"
                ? 0.76
                : 0.62
          });
        }
      );

    const seen =
      new Set();

    return candidates.filter(
      candidate => {
        const key =
          [
            candidate.semanticType,
            candidate.label
          ]
            .map(
              value =>
                String(
                  value ||
                  ""
                )
                  .toLowerCase()
                  .trim()
            )
            .join("|");

        if (
          !key ||
          seen.has(key)
        ) {
          return false;
        }

        seen.add(key);

        return true;
      }
    );
  },

  /* =====================================================
     DEVELOPER LAYER
  ===================================================== */

  async runDeveloperLayer(
    summary = {}
  ) {
    const ownerMode =
      summary.ownerMode === true ||
      summary.appContext
        ?.ownerMode === true ||
      summary.userContext
        ?.ownerMode === true;

    if (!ownerMode) {
      return summary;
    }

    const text =
      String(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const isDeveloperRequest =
      summary.routingContract
        ?.run?.developer === true ||
      summary.routingContract
        ?.mode === "developer" ||
      summary.conversationFunction
        ?.developerArtifactRequest ===
        true ||
      summary
        .artifactModificationRequest ===
        true ||
      summary
        .artifactCreationRequest ===
        true ||
      summary
        .artifactInvestigationRequest ===
        true ||
      summary
        .developerArtifactRequest ===
        true ||
      summary.primaryFunction ===
        "developer_artifact_request" ||
      summary.primaryFunction ===
        "build_or_debug_request" ||
      summary
        .situationContractPrimary ===
        "builder" ||
      summary
        .situationContractPrimary ===
        "developer_artifact" ||
      /\b(code|file|github|repo|commit|patch|function|html|css|javascript|api|engine|bug|fix|update|edit|build|implement|developer|composer|pipeline|latency|slow|bottleneck|performance|diagnose)\b/i
        .test(
          text
        );

    if (!isDeveloperRequest) {
      return summary;
    }

    const mark = label => {
      if (
        !summary.debugTiming ||
        !Array.isArray(
          summary.pipelineTiming
        )
      ) {
        return;
      }

      const start =
        typeof summary
          .pipelineTimingStart ===
          "number"
          ? summary
              .pipelineTimingStart
          : performance.now();

      summary
        .pipelineTiming
        .push({
          label,

          ms:
            Math.round(
              performance.now() -
              start
            )
        });
    };

    const run = async (
      key,
      engine,
      methods = []
    ) => {
      mark(
        `before ${key}`
      );

      let result =
        null;

      if (engine) {
        for (
          const method
          of methods
        ) {
          if (
            typeof engine[method] !==
            "function"
          ) {
            continue;
          }

          try {
            result =
              await engine[method](
                summary
              );
          } catch (error) {
            console.error(
              "Developer engine error:",
              method,
              error
            );

            result = {
              error:
                error?.message ||
                String(error)
            };
          }

          break;
        }
      }

      mark(
        `after ${key}`
      );

      if (result) {
        const rebirthKey =
          `rebirth${key
            .charAt(0)
            .toUpperCase()}${key.slice(
            1
          )}`;

        summary = {
          ...summary,

          [key]:
            result,

          [rebirthKey]:
            result,

          ...result,

          pipelineTiming:
            summary
              .pipelineTiming,

          pipelineTimingStart:
            summary
              .pipelineTimingStart
        };
      }

      return result;
    };

    const developerChain = [
      [
        "developerUnderstanding",
        window
          .AriRebirthDeveloperUnderstandingEngine,
        [
          "understand"
        ]
      ],

      [
        "projectKnowledgeGraph",
        window
          .AriRebirthProjectKnowledgeGraphEngine,
        [
          "build"
        ]
      ],

      [
        "capabilityRegistry",
        window
          .AriRebirthCapabilityRegistryEngine,
        [
          "inspect"
        ]
      ],

      [
        "architecture",
        window
          .AriRebirthArchitectureEngine,
        [
          "design"
        ]
      ],

      [
        "uiLayoutPlanner",
        window
          .AriRebirthUILayoutPlannerEngine,
        [
          "plan"
        ]
      ],

      [
        "bugDiagnosis",
        window
          .AriRebirthBugDiagnosisEngine,
        [
          "diagnose"
        ]
      ],

      [
        "executionPlanner",
        window
          .AriRebirthExecutionPlannerEngine,
        [
          "plan"
        ]
      ],

      [
        "codeEvidence",
        window
          .AriRebirthCodeEvidenceEngine,
        [
          "build"
        ]
      ],

      [
        "codeUnderstanding",
        window
          .AriRebirthCodeUnderstandingEngine,
        [
          "understand"
        ]
      ],

      [
        "patchDecision",
        window
          .AriRebirthPatchDecisionEngine,
        [
          "decide"
        ]
      ],

      [
        "patchValidation",
        window
          .AriRebirthPatchValidationEngine,
        [
          "validate"
        ]
      ],

      [
        "developerHandoff",
        window
          .AriRebirthDeveloperHandoffEngine,
        [
          "handoff",
          "create",
          "build"
        ]
      ]
    ];

    for (
      const [
        key,
        engine,
        methods
      ]
      of developerChain
    ) {
      await run(
        key,
        engine,
        methods
      );
    }

    if (
      summary.developerHandoff
    ) {
      summary.developerIntent =
        summary
          .developerHandoff
          .developerIntent ||
        null;

      summary.developerResponse =
        summary
          .developerHandoff
          .developerResponse ||
        summary.developerIntent
          ?.developerResponse ||
        null;

      summary.composerDeveloperPacket =
        summary
          .developerHandoff
          .composerDeveloperPacket ||
        summary
          .composerDeveloperPacket ||
        null;

      const hasDeveloperFinal =
        Boolean(
          summary
            .developerHandoff
            .reply
        ) ||
        Boolean(
          summary
            .developerHandoff
            .finalResponse
        );

      summary.developerResponseLocked =
        hasDeveloperFinal &&
        (
          summary
            .developerHandoff
            .developerResponseLocked ===
            true ||
          summary
            .developerHandoff
            .responseLocked ===
            true
        );

      summary.responseLocked =
        summary
          .developerResponseLocked;

      if (
        summary
          .developerResponseLocked
      ) {
        summary.finalResponse =
          summary
            .developerHandoff
            .reply ||
          summary
            .developerHandoff
            .finalResponse ||
          summary.finalResponse;
      }
    }

    return {
      ...summary,

      developerLayerRan:
        true,

      developerLayerSource:
        "ari-rebirth-pipeline",

      developerLayerVersion:
        this.version
    };
  },

  applyContractBridge(
    summary = {}
  ) {
    const contract =
      summary.situationContract ||
      {};

    const map =
      summary.situationMap ||
      {};

    const triage =
      summary.triage ||
      summary.ariTriage ||
      {};

    const routing =
      summary.routingContract ||
      {};

    const routingAuthoritative =
      routing.authority
        ?.authoritative ===
      true;

    const safetyOverride =
      summary.safetyDisposition
        ?.shouldStopNormalResponse ===
      true;

    const primary =
      safetyOverride
        ? (
            summary
              .safetyRequiredPlanner ||
            contract.primary ||
            triage.primaryLane ||
            "immediate_safety_response"
          )
        : routingAuthoritative &&
            routing.primaryLane
          ? routing.primaryLane
          : (
              contract.primary ||
              triage.primaryLane ||
              summary
                .primaryLaneSuggestion ||
              summary
                .situationContractPrimary ||
              summary.primaryLane ||
              "general_understanding"
            );

    const routedResponseShape =
      routingAuthoritative &&
      !safetyOverride
        ? routing.responseShape
        : null;

    return {
      ...summary,

      contractBridgeRan:
        true,

      contractBridgeSource:
        "ari-rebirth-pipeline",

      situationContract:
        contract,

      contextLane:
        routing.contextLane ||
        summary.contextLane ||
        summary.lane ||
        "direct_current_turn",

      primaryLane:
        primary,

      triagePrimaryLane:
        triage.primaryLane ||
        null,

      situationContractPrimary:
        primary,

      responseShape:
        routedResponseShape ||
        contract.responseShape ||
        triage.responseShape ||
        summary.responseShape ||
        "clear_explanation",

      responseRules:
        contract.responseRules ||
        triage
          .responseConstraints ||
        summary.responseRules ||
        [],

      responseConstraints:
        contract.responseRules ||
        triage
          .responseConstraints ||
        summary
          .responseConstraints ||
        [],

      primarySituationThesis:
        contract
          .situationThesis
          ?.thesis ||
        map
          .primarySituationThesis ||
        summary
          .primarySituationThesis ||
        null,

      situationNarrative:
        contract
          .situationThesis
          ?.narrative ||
        map.situationNarrative ||
        summary.situationNarrative ||
        null,

      thesisRecommendedUse:
        contract
          .situationThesis
          ?.recommendedUse ||
        map.thesisRecommendedUse ||
        summary.thesisRecommendedUse ||
        "do_not_use_as_authority",

      situationContractSupport:
        contract.support ||
        [],

      situationContractBrief:
        contract.brief ||
        [],

      situationContractContext:
        contract.context ||
        [],

      situationContractDeferred:
        contract.deferred ||
        [],

      situationContractBlocked:
        contract.blocked ||
        []
    };
  },

  /* =====================================================
     THREAD STATE SAVING
  ===================================================== */

  async saveFinalThreadState(
    summary = {}
  ) {
    if (
      !window
        .AriThreadStore
        ?.save
    ) {
      return {
        ...summary,

        threadSaveRan:
          false,

        threadSaveSource:
          "not-loaded",

        threadSaveReason:
          "thread_store_not_available"
      };
    }

    const previousThread =
      summary.threadState ||
      {};

    const userMessage =
      this.cleanText(
        summary.userMessage ||
        summary.message ||
        summary.input ||
        ""
      );

    const finalResponse =
      this.extractFinalResponseText(
        summary
      );

    const now =
      new Date()
        .toISOString();

    const previousRecentTurns =
      this.normalizeStoredRecentTurns(
        previousThread
      );

    const newTurns = [];

    if (userMessage) {
      newTurns.push({
        id:
          summary.currentTurnId ||
          summary.turnId ||
          null,

        role:
          "user",

        text:
          userMessage,

        createdAt:
          now,

        topic:
          this.normalizeTopicValue(
            summary.activeTopic ||
            previousThread.currentTopic
          ),

        semanticMeaning:
          summary
            .latestConversationMeaning ||
          summary
            .semanticSummary ||
          null,

        emotionalState:
          summary
            .humanState
            ?.primaryState ||
          summary
            .humanState
            ?.state ||
          summary.emotion ||
          null
      });
    }

    if (finalResponse) {
      newTurns.push({
        id:
          null,

        role:
          "assistant",

        text:
          finalResponse,

        createdAt:
          now,

        topic:
          this.normalizeTopicValue(
            summary.activeTopic ||
            previousThread.currentTopic
          ),

        semanticMeaning:
          null,

        emotionalState:
          summary.emotion ||
          null
      });
    }

    const recentTurns =
      this.dedupeRecentTurns([
        ...previousRecentTurns,
        ...newTurns
      ]).slice(-12);

    const lastMessages =
      recentTurns
        .filter(
          turn =>
            turn.role ===
            "user"
        )
        .map(
          turn =>
            turn.text
        )
        .filter(Boolean)
        .slice(-8);

    const immediatePreviousUserTurn =
      [...recentTurns]
        .reverse()
        .find(
          turn =>
            turn.role ===
            "user"
        ) ||
      null;

    const immediatePreviousAssistantTurn =
      [...recentTurns]
        .reverse()
        .find(
          turn =>
            turn.role ===
            "assistant"
        ) ||
      null;

    const topicCandidate =
      summary
        .resolvedPrimarySubject ||
      summary.activeTopic ||
      summary.activeSubject ||
      summary
        .continuityPacket
        ?.activeThread
        ?.activeTopic ||
      summary
        .situationMap
        ?.situations
        ?.[0] ||
      previousThread.currentTopic ||
      null;

    const normalizedTopic =
      this.normalizeTopicValue(
        topicCandidate
      );

    const realTopic =
      normalizedTopic ||
      this.normalizeTopicValue(
        previousThread.currentTopic
      ) ||
      this.deriveTopicFromMessage(
        userMessage
      ) ||
      "general_thread";

    const continuitySummary =
      userMessage &&
      finalResponse
        ? `User said: ${userMessage}. Ari answered: ${finalResponse.slice(
            0,
            300
          )}`
        : previousThread
            .continuitySummary ||
          null;

    const topicHistory =
      this.buildTopicHistory({
        previous:
          previousThread.topicHistory,

        currentTopic:
          realTopic,

        createdAt:
          now
      });

    const activeClaims =
      this.arrayFrom(
        summary.semanticClaims ||
        summary
          .currentSemanticStructure
          ?.claims ||
        summary
          .semanticStructure
          ?.claims ||
        previousThread.activeClaims
      ).slice(-16);

    const activeEntities =
      this.arrayFrom(
        summary.semanticEntities ||
        summary
          .currentSemanticStructure
          ?.entities ||
        summary
          .semanticStructure
          ?.entities ||
        previousThread.activeEntities
      ).slice(-16);

    const activeEvents =
      this.arrayFrom(
        summary.semanticEvents ||
        summary
          .currentSemanticStructure
          ?.events ||
        summary
          .semanticStructure
          ?.events ||
        previousThread.activeEvents
      ).slice(-16);

    const activeRelations =
      this.arrayFrom(
        summary.semanticRelations ||
        summary
          .currentSemanticStructure
          ?.relations ||
        summary
          .semanticStructure
          ?.relations ||
        previousThread.activeRelations
      ).slice(-16);

    const threadState = {
      ...previousThread,

      schema:
        "ari_persisted_thread_state",

      schemaVersion:
        "1.0.0",

      source:
        "ari-rebirth-pipeline",

      version:
        this.version,

      currentTopic:
        realTopic,

      topicHistory,

      recentTurns,

      lastMessages,

      immediatePreviousUserTurn,

      immediatePreviousAssistantTurn,

      continuitySummary,

      activeSubject:
        summary
          .resolvedPrimarySubject ||
        summary.activeSubject ||
        previousThread.activeSubject ||
        null,

      activeIssue:
        summary.activeIssue ||
        summary
          .continuityActiveSituation ||
        summary
          .situationMap
          ?.situations
          ?.[0] ||
        previousThread.activeIssue ||
        null,

      activeGoal:
        summary.activeGoal ||
        previousThread.activeGoal ||
        null,

      activeClaims,

      activeEntities,

      activeEvents,

      activeRelations,

      conversationMeaningHistory:
        summary
          .conversationMeaningHistory ||
        previousThread
          .conversationMeaningHistory ||
        [],

      latestConversationMeaning:
        summary
          .latestConversationMeaning ||
        previousThread
          .latestConversationMeaning ||
        null,

      activeSemanticTimeline:
        summary
          .activeSemanticTimeline ||
        previousThread
          .activeSemanticTimeline ||
        [],

      activeSemanticFrame:
        summary
          .activeSemanticFrame ||
        previousThread
          .activeSemanticFrame ||
        null,

      conversationMeaningFocus:
        summary
          .conversationMeaningFocus ||
        previousThread
          .conversationMeaningFocus ||
        null,

      conversationMeaningOpenLoops:
        summary
          .conversationMeaningOpenLoops ||
        previousThread
          .conversationMeaningOpenLoops ||
        [],

      activeConstraints:
        summary.activeConstraints ||
        summary
          .semanticConstraints ||
        previousThread
          .activeConstraints ||
        [],

      unresolvedItems:
        summary.continuityPacket
          ?.unresolvedReferences ||
        summary
          .semanticUnresolved ||
        previousThread
          .unresolvedItems ||
        [],

      previousAnswerSummary:
        finalResponse
          ? finalResponse.slice(
              0,
              500
            )
          : previousThread
              .previousAnswerSummary ||
            null,

      lastMealEstimate:
        summary.mealEstimate ||
        summary.lastMealEstimate ||
        previousThread
          .lastMealEstimate ||
        null,

      lastFinalResponse:
        finalResponse ||
        previousThread
          .lastFinalResponse ||
        null,

      lastUpdatedAt:
        now
    };

    try {
      await window
        .AriThreadStore
        .save(
          threadState
        );

      return {
        ...summary,

        threadSaveRan:
          true,

        threadSaveSource:
          "ari-thread-store",

        threadState,

        recentTurns,

        threadContext:
          summary.threadContext ||
          {
            schema:
              "ari_thread_context",

            schemaVersion:
              "1.0.0",

            source:
              "ari-rebirth-pipeline-thread-save",

            ran:
              true,

            activeTopic:
              realTopic,

            activeSubject:
              threadState.activeSubject,

            activeIssue:
              threadState.activeIssue,

            activeGoal:
              threadState.activeGoal,

            previousAnswer:
              threadState
                .previousAnswerSummary,

            recentTurns,

            immediatePreviousUserTurn,

            immediatePreviousAssistantTurn
          }
      };
    } catch (error) {
      console.error(
        "Ari thread-state save failed:",
        error
      );

      return {
        ...summary,

        threadSaveRan:
          false,

        threadSaveSource:
          "save-error",

        threadSaveError:
          error?.message ||
          String(error)
      };
    }
  },

  extractFinalResponseText(
    summary = {}
  ) {
    const candidate =
      summary.finalResponse ||
      summary.selectedDraft
        ?.text ||
      summary.selectedDraft ||
      summary.aiWriterDraft ||
      summary.blueprintWriterDraft ||
      "";

    if (
      candidate &&
      typeof candidate ===
        "object"
    ) {
      return this.cleanText(
        candidate.text ||
        candidate.reply ||
        candidate.response ||
        candidate.content ||
        ""
      );
    }

    return this.cleanText(
      candidate
    );
  },

  normalizeTopicValue(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return null;
    }

    if (
      typeof value ===
      "string"
    ) {
      return (
        this.cleanText(
          value
        ) ||
        null
      );
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(value);
    }

    if (
      typeof value ===
      "object"
    ) {
      const candidate =
        value.topic ||
        value.activeTopic ||
        value.label ||
        value.name ||
        value.title ||
        value.claim ||
        value.proposition ||
        value.summary ||
        value.description ||
        value.value ||
        value.text ||
        value.situation ||
        value.type ||
        null;

      if (
        candidate !== null &&
        candidate !== undefined
      ) {
        return this.normalizeTopicValue(
          candidate
        );
      }
    }

    return null;
  },

  deriveTopicFromMessage(
    message = ""
  ) {
    const text =
      this.cleanText(
        message
      );

    if (!text) {
      return null;
    }

    return text.length >
      140
      ? `${text.slice(
          0,
          137
        )}...`
      : text;
  },

  buildTopicHistory({
    previous = [],
    currentTopic = null,
    createdAt = null
  } = {}) {
    const history =
      this.arrayFrom(
        previous
      )
        .map(
          item => {
            if (
              typeof item ===
              "string"
            ) {
              return {
                topic:
                  this.normalizeTopicValue(
                    item
                  ),

                createdAt:
                  null
              };
            }

            return {
              ...item,

              topic:
                this.normalizeTopicValue(
                  item?.topic ||
                  item?.label ||
                  item?.value ||
                  item
                )
            };
          }
        )
        .filter(
          item =>
            item.topic
        );

    if (currentTopic) {
      const previousTopic =
        history.length
          ? history[
              history.length -
              1
            ].topic
          : null;

      if (
        this.cleanText(
          previousTopic
        )
          .toLowerCase() !==
        this.cleanText(
          currentTopic
        )
          .toLowerCase()
      ) {
        history.push({
          topic:
            currentTopic,

          createdAt:
            createdAt ||
            new Date()
              .toISOString()
        });
      }
    }

    return history.slice(-12);
  },

  extractContextLabel(
    value = null
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    if (
      typeof value ===
      "string"
    ) {
      return this.cleanText(
        value
      );
    }

    if (
      typeof value ===
      "number"
    ) {
      return String(value);
    }

    if (
      typeof value ===
      "object"
    ) {
      return this.cleanText(
        value.label ||
        value.name ||
        value.claim ||
        value.proposition ||
        value.value ||
        value.text ||
        value.surface ||
        value.description ||
        value.topic ||
        value.id ||
        ""
      );
    }

    return this.cleanText(
      String(value)
    );
  },

  /* =====================================================
     CANDIDATE DRAFTS
  ===================================================== */

  addCandidateDraft(
    existing = [],
    candidate = {}
  ) {
    const text =
      String(
        candidate.text ||
        ""
      ).trim();

    const current =
      Array.isArray(
        existing
      )
        ? existing
        : [];

    if (!text) {
      return current;
    }

    const duplicate =
      current.some(
        item =>
          String(
            item?.text ||
            ""
          ).trim() ===
            text &&
          item?.source ===
            candidate.source
      );

    if (duplicate) {
      return current;
    }

    return [
      ...current,

      {
        ...candidate,

        text,

        createdAt:
          candidate.createdAt ||
          Date.now()
      }
    ];
  },

  isUsableBlueprintDraft(
    draft = "",
    summary = {}
  ) {
    const text =
      String(
        draft
      ).trim();

    if (
      text.length <
      20
    ) {
      return false;
    }

    const lower =
      text.toLowerCase();

    const internalPhrases = [
      "answer the direct question",
      "explain only enough",
      "don’t turn every answer",
      "don't turn every answer",
      "blueprint writer",
      "the user is asking",
      "the simplest way to think about it is"
    ];

    if (
      internalPhrases.some(
        phrase =>
          lower.includes(
            phrase
          )
      )
    ) {
      return false;
    }

    const question =
      String(
        summary
          .resolvedUserQuestion ||
        summary.userMessage ||
        ""
      ).trim();

    return (
      !question ||
      text !== question
    );
  },

  saveAriConversationHistory(
    summary = {}
  ) {
    try {
      const userMessage =
        summary.userMessage ||
        summary.message ||
        summary.input ||
        "";

      const ariReply =
        summary.finalResponse ||
        summary.selectedDraft ||
        summary.aiWriterDraft ||
        summary.blueprintWriterDraft ||
        "";

      if (
        !userMessage ||
        !ariReply
      ) {
        return {
          saved:
            false,

          source:
            "local-storage",

          reason:
            "missing_user_message_or_reply"
        };
      }

      const history =
        JSON.parse(
          localStorage.getItem(
            "ariConversationHistory"
          ) ||
          "[]"
        );

      const createdAt =
        new Date()
          .toISOString();

      history.push({
        id:
          Date.now(),

        title:
          String(
            userMessage
          ).slice(
            0,
            80
          ),

        preview:
          String(
            ariReply
          ).slice(
            0,
            180
          ),

        messages: [
          {
            role:
              "user",

            content:
              userMessage,

            created_at:
              createdAt
          },

          {
            role:
              "ari",

            content:
              ariReply,

            emotion:
              summary.emotion ||
              null,

            created_at:
              createdAt
          }
        ],

        created_at:
          createdAt
      });

      const retainedHistory =
        history.slice(-100);

      localStorage.setItem(
        "ariConversationHistory",
        JSON.stringify(
          retainedHistory
        )
      );

      return {
        saved:
          true,

        source:
          "local-storage",

        historyCount:
          retainedHistory.length
      };
    } catch (error) {
      console.warn(
        "Ari conversation history save failed:",
        error
      );

      return {
        saved:
          false,

        source:
          "local-storage",

        error:
          error?.message ||
          String(error)
      };
    }
  },

  /* =====================================================
     DEBUGGING
  ===================================================== */

  debugLog(
    summary = {}
  ) {
    console.log(
      "===== ARI REBIRTH PIPELINE =====",
      this.version
    );

    console.log(
      "===== PIPELINE ARCHITECTURE =====",
      {
        architecture:
          summary
            .pipelineArchitecture,

        complete:
          summary
            .pipelineLifecycleComplete,

        layers:
          summary.pipelineLayers,

        lifecycleErrors:
          summary
            .pipelineLifecycleErrors ||
          []
      }
    );

    console.log(
      "===== THREAD STATE =====",
      {
        loaded:
          summary
            .threadStateLoaded,

        loadReason:
          summary
            .threadStateLoadReason ||
          null,

        threadContext:
          summary.threadContext ||
          null,

        recentTurns:
          summary.recentTurns ||
          [],

        immediatePreviousUserTurn:
          summary
            .immediatePreviousUserTurn ||
          null,

        immediatePreviousAssistantTurn:
          summary
            .immediatePreviousAssistantTurn ||
          null
      }
    );

    console.log(
      "===== PERCEPTION PACKET =====",
      summary.perceptionPacket
    );

    console.log(
      "===== EXECUTIVE PACKET =====",
      summary.executivePacket
    );

    console.log(
      "===== ROUTING CONTRACT =====",
      summary.routingContract
    );

    console.log(
      "===== DELIBERATION PACKET =====",
      summary.deliberationPacket
    );

    console.log(
      "===== EXPRESSION PACKET =====",
      summary.expressionPacket
    );

    console.log(
      "===== DELIVERY PACKET =====",
      summary.deliveryPacket
    );

    console.log(
      "===== PIPELINE LAYER ERRORS =====",
      {
        lifecycle:
          summary
            .pipelineLifecycleErrors ||
          [],

        deliberation:
          summary
            .deliberationStageErrors ||
          [],

        expression:
          summary
            .expressionStageErrors ||
          [],

        delivery:
          summary
            .deliveryStageErrors ||
          []
      }
    );

    console.log(
      "===== SAFETY =====",
      {
        earlyGate:
          summary
            .safetyContextGate,

        eligibility:
          summary
            .safetyEligibility,

        deepSafety:
          summary
            .deepSafetyResult,

        disposition:
          summary
            .safetyDisposition
      }
    );

    console.log(
      "===== ROUTING =====",
      {
        laneSplit:
          summary.laneSplit,

        contextLane:
          summary.contextLane,

        primaryLane:
          summary.primaryLane,

        applicability:
          summary
            .routingApplicability
      }
    );

    console.log(
      "===== CONTINUITY =====",
      {
        packet:
          summary
            .continuityPacket,

        threadContext:
          summary.threadContext,

        recentTurns:
          summary.recentTurns,

        resolvedQuestion:
          summary
            .resolvedUserQuestion
      }
    );

    console.log(
      "===== SITUATION =====",
      {
        map:
          summary.situationMap,

        triage:
          summary.triage,

        multiLanePlan:
          summary.multiLanePlan,

        contract:
          summary
            .situationContract
      }
    );

    console.log(
      "===== REASONING =====",
      {
        cognitiveExecutive:
          summary
            .cognitiveExecutive,

        reasoning:
          summary.reasoning,

        developer:
          summary
            .developerHandoff ||
          summary
            .unlockedDeveloperHandoff ||
          summary
            .developerUnderstanding
      }
    );

    console.log(
      "===== MEMORY =====",
      {
        retrieval:
          summary
            .memoryRetrieval,

        context:
          summary
            .memoryContextResult ||
          summary.memoryContext,

        facts:
          summary.memoryFacts
      }
    );

    console.log(
      "===== UNDERSTANDING =====",
      {
        language:
          summary
            .languageUnderstanding,

        semantic:
          summary
            .semanticUnderstanding,

        event:
          summary
            .eventUnderstanding,

        meaning:
          summary
            .meaningInterpretation,

        humanState:
          summary.humanState
      }
    );

    console.log(
      "===== EXPRESSION =====",
      {
        character:
          summary
            .characterHandoff,

        languageGuidance:
          summary
            .languageGuidanceHandoff,

        responseStrategy:
          summary
            .responseStrategy,

        composerPacket:
          summary
            .composerPacket,

        blueprintWriter:
          summary
            .blueprintWriter,

        aiWriter:
          summary.aiWriter,

        selectedDraft:
          summary
            .selectedDraft
      }
    );

    console.log(
      "===== DELIVERY =====",
      {
        actions:
          summary
            .actionHandoff,

        persistence:
          summary
            .learningPersistenceHandoff,

        diagnostics:
          summary
            .deliveryDiagnostics
      }
    );

    console.log(
      "===== FINAL RESPONSE =====",
      summary.finalResponse
    );

    console.log(
      "===== GITHUB EVIDENCE =====",
      {
        available:
          summary
            .githubEvidenceAvailable,

        filePath:
          summary
            .githubEvidence
            ?.filePath,

        contentLength:
          summary
            .githubEvidence
            ?.contentLength,

        preview:
          summary
            .githubEvidence
            ?.contentPreview
            ?.slice(
              0,
              300
            ) ||
          null
      }
    );
  },

  /* =====================================================
     GENERAL HELPERS
  ===================================================== */

  arrayFrom(
    value
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      return value;
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    return [
      value
    ];
  },

  cleanText(
    value = ""
  ) {
    return String(
      value ??
      ""
    )
      .replace(
        /[’‘]/g,
        "'"
      )
      .replace(
        /[“”]/g,
        "\""
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();
  }
};

console.log(
  "ARI REBIRTH PIPELINE LOADED:",
  window.AriRebirthPipeline?.version
);