// ari/pipeline-stages/delivery/ari-learning-persistence-stage.js
// Ari Learning Persistence Stage
// Purpose: Update conversation meaning, detect memory candidates,
// persist approved memory, save thread state, and save local conversation history.
// V1.0.0 — Meaning History / Memory Persistence / Thread Persistence

window.Ari = window.Ari || {};

window.AriLearningPersistenceStage = {
  version: "1.0.0",

  async run(summary = {}, runtime = {}) {
    const {
      mark = () => {},

      runEngine = async (
        _engine,
        _methods,
        fallback = {}
      ) => fallback,

      saveFinalThreadState =
        async state => state,

      saveAriConversationHistory =
        () => {}
    } = runtime;

    let state = {
      ...summary,
      activeDeliveryStage: "learning_persistence"
    };

    const persistenceEligibility =
      this.resolvePersistenceEligibility(state);

    state = {
      ...state,

      persistenceEligibility,

      shouldBuildConversationMeaningHistory:
        persistenceEligibility.buildMeaningHistory,

      shouldDetectMemoryCandidates:
        persistenceEligibility.detectMemoryCandidates,

      shouldSaveThreadState:
        persistenceEligibility.saveThread,

      shouldSaveConversationHistory:
        persistenceEligibility.saveConversationHistory
    };

    // =================================================
    // 1. Conversation Meaning History
    // =================================================

    mark("before conversationMeaningHistory");

    const conversationMeaningHistoryResult =
      persistenceEligibility.buildMeaningHistory &&
      window.Ari?.conversationMeaningHistory?.build
        ? await window.Ari.conversationMeaningHistory.build(
            state
          )
        : {
            conversationMeaningHistoryRan:
              false,

            source:
              persistenceEligibility.buildMeaningHistory
                ? "not-loaded"
                : "skipped-by-persistence-eligibility",

            conversationMeaningHistory:
              state.conversationMeaningHistory ||
              [],

            latestConversationMeaning:
              state.latestConversationMeaning ||
              null,

            priorMeaningForFollowUp:
              state.priorMeaningForFollowUp ||
              null,

            reason:
              persistenceEligibility.buildMeaningHistory
                ? "conversation_meaning_history_not_loaded"
                : "meaning_history_not_required"
          };

    state = {
      ...state,

      conversationMeaningHistoryState:
        conversationMeaningHistoryResult,

      ...conversationMeaningHistoryResult,

      conversationMeaningHistoryRan:
        conversationMeaningHistoryResult
          .conversationMeaningHistoryRan === true,

      conversationMeaningHistorySource:
        conversationMeaningHistoryResult.source ||
        "unknown"
    };

    mark("after conversationMeaningHistory");

    // =================================================
    // 2. Memory Candidate Detection
    // =================================================

    mark("before memoryCandidateDetection");

    const memoryCandidateResult =
      persistenceEligibility.detectMemoryCandidates
        ? await runEngine(
            window.AriMemoryCandidateEngine,

            ["detect", "create", "evaluate"],

            {
              memoryCandidateRan:
                false,

              source:
                "not-loaded",

              memoryCandidates: [],

              reason:
                "memory_candidate_engine_not_loaded"
            },

            state
          )
        : {
            memoryCandidateRan:
              false,

            source:
              "skipped-by-persistence-eligibility",

            memoryCandidates: [],

            reason:
              "memory_candidate_detection_not_required"
          };

    state = {
      ...state,

      ...memoryCandidateResult,

      memoryCandidateResult,

      memoryCandidateRan:
        memoryCandidateResult
          .memoryCandidateRan === true,

      memoryCandidateSource:
        memoryCandidateResult.source ||
        "unknown",

      memoryCandidates:
        memoryCandidateResult.memoryCandidates ||
        state.memoryCandidates ||
        []
    };

    mark("after memoryCandidateDetection");

    // =================================================
    // 3. Memory Candidate Persistence
    // =================================================

    mark("before memoryCandidateSave");

    const memorySaveEligibility =
      this.resolveMemorySaveEligibility(state);

    let memorySaveResult = null;

    if (
      memorySaveEligibility.save &&
      window.AriMemoryStore?.saveCandidates
    ) {
      try {
        memorySaveResult =
          await window.AriMemoryStore.saveCandidates(
            state.memoryCandidates
          );
      } catch (error) {
        console.error(
          "Ari memory candidate save failed:",
          error
        );

        memorySaveResult = {
          saved:
            false,

          source:
            "ari-memory-store",

          error:
            error?.message ||
            String(error)
        };
      }
    } else {
      memorySaveResult = {
        saved:
          false,

        source:
          memorySaveEligibility.save
            ? "not-loaded"
            : "skipped-by-persistence-eligibility",

        reason:
          memorySaveEligibility.reason
      };
    }

    state = {
      ...state,

      memorySaveEligibility,

      memorySaveRan:
        memorySaveEligibility.save &&
        Boolean(memorySaveResult),

      memorySaveResult,

      memorySaveSource:
        memorySaveResult?.source ||
        (
          memorySaveEligibility.save
            ? "ari-memory-store"
            : "skipped"
        )
    };

    mark("after memoryCandidateSave");

    // =================================================
    // 4. Thread-State Persistence
    // =================================================

    mark("before saveFinalThreadState");

    if (persistenceEligibility.saveThread) {
      try {
        const threadSaveResult =
          await saveFinalThreadState(state);

        if (
          threadSaveResult &&
          typeof threadSaveResult === "object"
        ) {
          state = threadSaveResult;
        }

        state = {
          ...state,

          threadSaveRan:
            state.threadSaveRan === true,

          threadSaveSource:
            state.threadSaveRan === true
              ? "ari-thread-store"
              : state.threadSaveSource ||
                "thread_save_not_confirmed"
        };
      } catch (error) {
        console.error(
          "Ari final thread-state save failed:",
          error
        );

        state = {
          ...state,

          threadSaveRan:
            false,

          threadSaveSource:
            "stage-error",

          threadSaveError:
            error?.message ||
            String(error)
        };
      }
    } else {
      state = {
        ...state,

        threadSaveRan:
          false,

        threadSaveSource:
          "skipped-by-persistence-eligibility",

        threadSaveReason:
          "thread_save_not_required"
      };
    }

    mark("after saveFinalThreadState");

    // =================================================
    // 5. Local Conversation-History Persistence
    // =================================================

    mark("before saveConversationHistory");

    if (
      persistenceEligibility.saveConversationHistory
    ) {
      try {
        const historySaveResult =
          await saveAriConversationHistory(
            state
          );

        state = {
          ...state,

          conversationHistorySaveRan:
            historySaveResult?.saved === false
              ? false
              : true,

          conversationHistorySaveResult:
            historySaveResult ||
            null,

          conversationHistorySaveSource:
            historySaveResult?.source ||
            "ari-conversation-history"
        };
      } catch (error) {
        console.warn(
          "Ari conversation-history save failed:",
          error
        );

        state = {
          ...state,

          conversationHistorySaveRan:
            false,

          conversationHistorySaveSource:
            "stage-error",

          conversationHistorySaveError:
            error?.message ||
            String(error)
        };
      }
    } else {
      state = {
        ...state,

        conversationHistorySaveRan:
          false,

        conversationHistorySaveSource:
          "skipped-by-persistence-eligibility",

        conversationHistorySaveReason:
          "conversation_history_save_not_required"
      };
    }

    mark("after saveConversationHistory");

    // =================================================
    // 6. Learning and Persistence Handoff
    // =================================================

    state.learningPersistenceHandoff =
      this.buildLearningPersistenceHandoff(
        state
      );

    // =================================================
    // 7. Stage Packet
    // =================================================

    state.learningPersistenceStagePacket =
      this.buildLearningPersistenceStagePacket(
        state
      );

    state.learningPersistenceStageRan =
      true;

    state.learningPersistenceStageSource =
      "ari-learning-persistence-stage";

    state.learningPersistenceStageVersion =
      this.version;

    return state;
  },

  // ===================================================
  // Persistence eligibility
  // ===================================================

  resolvePersistenceEligibility(
    summary = {}
  ) {
    const finalResponse =
      String(
        summary.finalResponse ||
        ""
      ).trim();

    const hasFinalResponse =
      Boolean(finalResponse);

    const hasUserMessage =
      Boolean(
        String(
          summary.userMessage ||
          summary.message ||
          summary.input ||
          ""
        ).trim()
      );

    const responseUsable =
      summary.finalResponseUsable !== false &&
      hasFinalResponse;

    return {
      buildMeaningHistory:
        hasUserMessage &&
        responseUsable,

      detectMemoryCandidates:
        hasUserMessage &&
        responseUsable,

      saveThread:
        hasUserMessage &&
        responseUsable,

      saveConversationHistory:
        hasUserMessage &&
        responseUsable,

      hasUserMessage,
      hasFinalResponse,
      responseUsable,

      source:
        "ari-learning-persistence-stage-eligibility",

      reason:
        !hasUserMessage
          ? "user_message_missing"
          : !hasFinalResponse
            ? "final_response_missing"
            : !responseUsable
              ? "final_response_not_usable"
              : "post_response_persistence_required"
    };
  },

  // ===================================================
  // Memory-save eligibility
  // ===================================================

  resolveMemorySaveEligibility(
    summary = {}
  ) {
    const candidates =
      Array.isArray(summary.memoryCandidates)
        ? summary.memoryCandidates
        : [];

    const usableCandidates =
      candidates.filter(candidate =>
        candidate &&
        candidate.blocked !== true &&
        candidate.rejected !== true &&
        candidate.shouldSave !== false
      );

    return {
      save:
        summary.memoryCandidateRan === true &&
        usableCandidates.length > 0,

      candidateCount:
        candidates.length,

      usableCandidateCount:
        usableCandidates.length,

      usableCandidates,

      reason:
        summary.memoryCandidateRan !== true
          ? "memory_candidate_detection_did_not_run"
          : usableCandidates.length === 0
            ? "no_usable_memory_candidates"
            : "usable_memory_candidates_available"
    };
  },

  // ===================================================
  // Learning handoff
  // ===================================================

  buildLearningPersistenceHandoff(
    summary = {}
  ) {
    return {
      ready:
        true,

      meaningHistory: {
        ran:
          summary
            .conversationMeaningHistoryRan === true,

        source:
          summary
            .conversationMeaningHistorySource ||
          null,

        history:
          summary.conversationMeaningHistory ||
          [],

        latestMeaning:
          summary.latestConversationMeaning ||
          null,

        priorMeaning:
          summary.priorMeaningForFollowUp ||
          null
      },

      memoryLearning: {
        detectionRan:
          summary.memoryCandidateRan === true,

        source:
          summary.memoryCandidateSource ||
          null,

        candidates:
          summary.memoryCandidates ||
          [],

        saveEligibility:
          summary.memorySaveEligibility ||
          null,

        saveRan:
          summary.memorySaveRan === true,

        saveResult:
          summary.memorySaveResult ||
          null
      },

      persistence: {
        threadSaved:
          summary.threadSaveRan === true,

        threadSource:
          summary.threadSaveSource ||
          null,

        conversationHistorySaved:
          summary
            .conversationHistorySaveRan === true,

        conversationHistorySource:
          summary
            .conversationHistorySaveSource ||
          null
      },

      authority: {
        canBuildMeaningHistory:
          true,

        canDetectMemoryCandidates:
          true,

        canPersistApprovedMemory:
          true,

        canSaveThreadState:
          true,

        canSaveConversationHistory:
          true,

        canChangeFinalResponse:
          false,

        canChangeRouting:
          false,

        role:
          "post_response_learning_and_state_persistence"
      }
    };
  },

  // ===================================================
  // Stage packet
  // ===================================================

  buildLearningPersistenceStagePacket(
    summary = {}
  ) {
    return {
      ready:
        true,

      source:
        "ari-learning-persistence-stage",

      version:
        this.version,

      eligibility:
        summary.persistenceEligibility ||
        null,

      meaningHistory: {
        ran:
          summary
            .conversationMeaningHistoryRan === true,

        source:
          summary
            .conversationMeaningHistorySource ||
          null,

        value:
          summary
            .conversationMeaningHistoryState ||
          null,

        latestMeaning:
          summary.latestConversationMeaning ||
          null
      },

      memoryCandidates: {
        ran:
          summary.memoryCandidateRan === true,

        source:
          summary.memoryCandidateSource ||
          null,

        candidates:
          summary.memoryCandidates ||
          [],

        raw:
          summary.memoryCandidateResult ||
          null
      },

      memorySave: {
        eligible:
          summary.memorySaveEligibility
            ?.save === true,

        ran:
          summary.memorySaveRan === true,

        source:
          summary.memorySaveSource ||
          null,

        result:
          summary.memorySaveResult ||
          null
      },

      threadPersistence: {
        ran:
          summary.threadSaveRan === true,

        source:
          summary.threadSaveSource ||
          null,

        error:
          summary.threadSaveError ||
          null
      },

      conversationHistory: {
        ran:
          summary
            .conversationHistorySaveRan === true,

        source:
          summary
            .conversationHistorySaveSource ||
          null,

        result:
          summary
            .conversationHistorySaveResult ||
          null,

        error:
          summary
            .conversationHistorySaveError ||
          null
      },

      handoff:
        summary.learningPersistenceHandoff ||
        null,

      authority: {
        canUpdateMeaningHistory:
          true,

        canDetectMemoryCandidates:
          true,

        canSaveApprovedMemories:
          true,

        canSaveThreadState:
          true,

        canSaveConversationHistory:
          true,

        canChangeFinalResponse:
          false,

        canExecuteExternalActions:
          false,

        role:
          "learning_and_persistence_orchestration"
      }
    };
  }
};

console.log(
  "ARI LEARNING PERSISTENCE STAGE LOADED:",
  window.AriLearningPersistenceStage?.version
);