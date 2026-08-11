// =====================================================
// ARI REBIRTH
// File: ari/pipeline-stages/delivery/ari-persistence-cleanup-patch.js
// Version: 1.0.0
// Purpose:
//   Repair short-term thread persistence when the master runtime does not
//   inject a saveFinalThreadState callback into the delivery stage.
//
// Thread state is conversation continuity, not long-term memory. A missing
// callback must not cause every successfully delivered turn to end with
// threadSaved=false.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const stage = window.AriLearningPersistenceStage || window.Ari?.learningPersistenceStage;
  if (!stage || stage.__ariThreadPersistenceCleanupPatched === true) return;

  const originalRun = stage.run.bind(stage);
  stage.__ariThreadPersistenceCleanupPatched = true;

  function text(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function resolveUserText(state = {}) {
    return text(
      state.currentTurn?.effectiveText ||
      state.currentTurn?.originalText ||
      state.userMessage ||
      state.message ||
      state.input
    );
  }

  function resolveAssistantText(state = {}) {
    return text(
      state.finalResponse ||
      state.responseText ||
      state.reply ||
      state.authoritativeDraft
    );
  }

  function buildThreadState(prior = {}, state = {}) {
    const userText = resolveUserText(state);
    const assistantText = resolveAssistantText(state);
    const newMessages = [];

    if (userText) {
      newMessages.push({
        role: "user",
        content: userText,
        turnId: state.currentTurnId || state.turnId || null,
        createdAt: new Date().toISOString()
      });
    }

    if (assistantText) {
      newMessages.push({
        role: "assistant",
        content: assistantText,
        turnId: state.currentTurnId || state.turnId || null,
        createdAt: new Date().toISOString()
      });
    }

    const semanticFrame =
      state.validatedSemanticFrame ||
      state.semanticFrame ||
      state.cognitiveReasoningResult?.semanticFrame ||
      null;

    return {
      ...prior,
      currentTopic:
        semanticFrame?.topic ||
        semanticFrame?.domain ||
        prior.currentTopic ||
        null,
      activeSubject:
        semanticFrame?.subject ||
        semanticFrame?.primarySubject ||
        prior.activeSubject ||
        null,
      activeGoal:
        semanticFrame?.userGoal ||
        semanticFrame?.goal ||
        prior.activeGoal ||
        null,
      lastMessages: [
        ...array(prior.lastMessages),
        ...newMessages
      ].slice(-8),
      conversationMeaningHistory:
        array(state.conversationMeaningHistory).length
          ? array(state.conversationMeaningHistory).slice(-12)
          : array(prior.conversationMeaningHistory).slice(-12),
      latestConversationMeaning:
        state.latestConversationMeaning ||
        prior.latestConversationMeaning ||
        null,
      activeSemanticFrame:
        semanticFrame ||
        prior.activeSemanticFrame ||
        null,
      previousAnswerSummary:
        assistantText
          ? assistantText.slice(0, 500)
          : prior.previousAnswerSummary || null,
      lastFinalResponse:
        assistantText ||
        prior.lastFinalResponse ||
        null,
      lastMealEstimate:
        state.lastMealEstimate ||
        state.mealEstimate ||
        prior.lastMealEstimate ||
        null
    };
  }

  stage.run = async function patchedLearningPersistenceRun(summary = {}, runtime = {}) {
    let state = await originalRun(summary, runtime);

    const shouldSave =
      state?.persistenceEligibility?.saveThread === true &&
      state.threadSaveRan !== true;

    const store = window.AriThreadStore || window.Ari?.threadStore;

    if (shouldSave && store && typeof store.save === "function") {
      try {
        const loaded = typeof store.load === "function"
          ? await store.load(state)
          : (window.Ari.threadState || {});

        const prior =
          loaded && typeof loaded === "object"
            ? loaded
            : {};

        const threadState = buildThreadState(prior, state);
        const saveResult = await store.save(threadState);
        const saved = saveResult?.success === true || saveResult?.saved === true;

        state = {
          ...state,
          threadState,
          threadSaveRan: saved,
          threadSaveSource:
            saveResult?.source ||
            (saved ? "ari-thread-store" : "ari-thread-store-save-unconfirmed"),
          threadSaveResult: saveResult || null,
          threadSaveError: saved ? null : state.threadSaveError || null
        };

        if (state.learningPersistenceHandoff && typeof state.learningPersistenceHandoff === "object") {
          state.learningPersistenceHandoff = {
            ...state.learningPersistenceHandoff,
            persistence: {
              ...(state.learningPersistenceHandoff.persistence || {}),
              threadSaved: saved,
              threadSource: state.threadSaveSource
            }
          };
        }

        if (state.learningPersistenceStagePacket && typeof state.learningPersistenceStagePacket === "object") {
          state.learningPersistenceStagePacket = {
            ...state.learningPersistenceStagePacket,
            threadPersistence: {
              ...(state.learningPersistenceStagePacket.threadPersistence || {}),
              ran: saved,
              source: state.threadSaveSource,
              error: state.threadSaveError || null,
              result: saveResult || null
            },
            handoff: state.learningPersistenceHandoff || state.learningPersistenceStagePacket.handoff || null
          };
        }
      } catch (error) {
        state = {
          ...state,
          threadSaveRan: false,
          threadSaveSource: "ari-thread-store-save-failed",
          threadSaveError: error?.message || String(error)
        };
      }
    }

    return state;
  };
})();