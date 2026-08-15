// =====================================================
// ARI XP
// File: js/home-resilience.js
// Version: 1.0.0
// Purpose:
//   Keep Ask Ari recoverable when an iOS WebView is backgrounded.
//   - Persists the in-flight user turn before network work begins.
//   - Never renders raw transport or deliberation diagnostics to users.
//   - Reconciles a completed Supabase conversation turn on resume.
//   - Retries one interrupted turn when no completed answer was saved.
//   - Filters internal failure markers from short-term conversation history.
// =====================================================

(() => {
  "use strict";

  const PENDING_KEY = "arixp_pending_ari_turn_v1";
  const MAX_BACKGROUND_RETRIES = 1;
  const RESUME_DELAY_MS = 350;

  let requestInFlight = false;
  let recoveryTimer = null;

  function cleanText(value = "") {
    return String(value || "").trim();
  }

  function isInternalFailureText(value = "") {
    const text = cleanText(value);
    if (!text) return true;

    return (
      /^(?:inside_deliberation|outside_deliberation|required_deliberation|semantic_validation|response_planning|reasoning_stage|reasoningstage)[\s:_-]/i.test(text) ||
      /^(?:load failed|failed to fetch|network request failed|the network connection was lost)$/i.test(text) ||
      /^ari[_ -]pipeline[_ -]error/i.test(text)
    );
  }

  function isTransientRequestError(error) {
    const name = cleanText(error?.name).toLowerCase();
    const message = cleanText(error?.message || error).toLowerCase();

    if (document.visibilityState === "hidden") return true;
    if (name === "aborterror" || name === "networkerror") return true;

    return /load failed|failed to fetch|network|offline|internet|connection|request aborted|cancelled|canceled|timed? out|ari_internal_transient/.test(message);
  }

  function readPendingTurn() {
    try {
      const saved = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
      if (!saved?.message || !saved?.startedAt) return null;
      return saved;
    } catch {
      return null;
    }
  }

  function writePendingTurn(turn) {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(turn));
    } catch {
      // Recovery is best-effort; an active request can still complete normally.
    }
    return turn;
  }

  function clearPendingTurn() {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      // Non-critical.
    }
  }

  function createPendingTurn(message) {
    return writePendingTurn({
      id:
        typeof window.crypto?.randomUUID === "function"
          ? window.crypto.randomUUID()
          : `ari-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      message: cleanText(message),
      startedAt: new Date().toISOString(),
      retries: 0
    });
  }

  function messageAlreadyRendered(text, sender = "ari") {
    const expected = cleanText(text);
    if (!expected) return false;

    const selector = sender === "user"
      ? ".ari-message.ari-user p"
      : ".ari-message.ari-ai p";

    return [...document.querySelectorAll(selector)]
      .some((node) => cleanText(node.textContent) === expected);
  }

  function rememberAssistantReply(message, reply) {
    ariChatHistory.push({ role: "assistant", content: reply });
    ariChatHistory = ariChatHistory.slice(-10);

    ariFirstReplyCompleted = true;
    applyAriAfterResponseEmotion(message, reply);
  }

  async function applySuccessfulResponse(pending, response) {
    const reply = cleanText(response?.reply || response?.text || response?.message);

    if (!reply || isInternalFailureText(reply)) {
      const error = new Error("ARI_INTERNAL_TRANSIENT");
      error.code = "ARI_INTERNAL_TRANSIENT";
      throw error;
    }

    finishAriThinkingSequence();

    if (!messageAlreadyRendered(reply, "ari")) {
      addAriMessage(reply, "ari");
    }

    rememberAssistantReply(pending.message, reply);

    if (response?.pendingAction) {
      showPendingAction(response.pendingAction);
    }

    clearPendingTurn();
    await refreshHomeDashboard();
    return true;
  }

  async function findSavedCompletedTurn(pending) {
    const client = window.calbuddySupabase || window.CalBuddy?.supabase;
    const session = await window.CalBuddy?.getCurrentSession?.();

    if (!client || !session?.user?.id) return null;

    try {
      const { data, error } = await client
        .from("ari_conversation_turns")
        .select("user_message,assistant_message,created_at")
        .eq("user_id", session.user.id)
        .eq("user_message", pending.message)
        .gte("created_at", pending.startedAt)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) return null;

      const match = (Array.isArray(data) ? data : []).find((turn) => {
        const reply = cleanText(turn?.assistant_message);
        return reply && !isInternalFailureText(reply);
      });

      return match || null;
    } catch {
      return null;
    }
  }

  function finishRequestUi() {
    ariAbortController = null;
    ariBusy = false;
    setAriPose("idleOpen");
    setAriComposerThinking(false);
  }

  async function executePendingTurn(pending, { recovery = false } = {}) {
    if (!pending || requestInFlight) return;

    requestInFlight = true;
    ariStopped = false;
    ariAbortController = new AbortController();

    if (recovery) {
      enterAriConversationMode();
      setAriPresenceFocus(false);
      setAriComposerThinking(true);
    }

    try {
      const response = await CalBuddy.askAri({
        message: pending.message,
        history: ariChatHistory,
        debugTiming: true
      });

      if (ariStopped) {
        clearPendingTurn();
        return;
      }

      await applySuccessfulResponse(pending, response);
    } catch (error) {
      if (ariStopped) {
        clearPendingTurn();
        return;
      }

      const transient = isTransientRequestError(error);
      const latest = readPendingTurn() || pending;

      // iOS commonly pauses WKWebView networking when the app backgrounds.
      // Keep the turn pending and reconcile it when the app becomes active.
      if (transient && Number(latest.retries || 0) < MAX_BACKGROUND_RETRIES) {
        finishAriThinkingSequence();
        setAriComposerThinking(false);
        schedulePendingRecovery();
        return;
      }

      clearPendingTurn();
      finishAriThinkingSequence();
      setAriPose("idleOpen");

      if (!messageAlreadyRendered("I couldn't finish that request. Tap Send to try it again.", "ari")) {
        addAriMessage("I couldn't finish that request. Tap Send to try it again.", "ari");
      }

      ariFirstReplyCompleted = true;
      resetAriAfterDelay();
    } finally {
      requestInFlight = false;
      ariAbortController = null;

      if (!ariStopped && !readPendingTurn()) {
        setAriComposerThinking(false);
      }
    }
  }

  async function recoverPendingTurn() {
    if (document.visibilityState !== "visible" || requestInFlight) return;

    const pending = readPendingTurn();
    if (!pending) return;

    const savedTurn = await findSavedCompletedTurn(pending);

    if (savedTurn?.assistant_message) {
      const reply = cleanText(savedTurn.assistant_message);
      enterAriConversationMode();

      if (!messageAlreadyRendered(pending.message, "user")) {
        addAriMessage(pending.message, "user");
      }
      if (!messageAlreadyRendered(reply, "ari")) {
        addAriMessage(reply, "ari");
      }

      rememberAssistantReply(pending.message, reply);
      clearPendingTurn();
      finishRequestUi();
      return;
    }

    const retries = Number(pending.retries || 0);
    if (retries >= MAX_BACKGROUND_RETRIES) {
      clearPendingTurn();
      finishRequestUi();
      return;
    }

    const retryTurn = writePendingTurn({
      ...pending,
      retries: retries + 1,
      resumedAt: new Date().toISOString()
    });

    await executePendingTurn(retryTurn, { recovery: true });
  }

  function schedulePendingRecovery() {
    clearTimeout(recoveryTimer);
    recoveryTimer = setTimeout(() => {
      recoveryTimer = null;
      void recoverPendingTurn();
    }, RESUME_DELAY_MS);
  }

  async function resilientSendAriMessage() {
    const input = document.getElementById("ariInput");
    if (!input || requestInFlight) return;

    const message = cleanText(input.value);
    if (!message) return;

    ariConversationStarted = true;
    ariBusy = false;
    setAriPresenceFocus(false);
    setAriPose("idleOpen");
    enterAriConversationMode();

    input.value = "";
    autoResizeAriInput();

    addAriMessage(message, "user");

    ariChatHistory.push({ role: "user", content: message });
    ariChatHistory = ariChatHistory.slice(-10);

    const pending = createPendingTurn(message);
    setAriComposerThinking(true);

    await executePendingTurn(pending);
  }

  // Prevent internal diagnostic strings from being persisted into continuity.
  if (window.CalBuddy?.saveConversationTurn) {
    const originalSaveConversationTurn = window.CalBuddy.saveConversationTurn.bind(window.CalBuddy);
    window.CalBuddy.saveConversationTurn = async (turn = {}) => {
      if (isInternalFailureText(turn?.reply)) return false;
      return await originalSaveConversationTurn(turn);
    };
  }

  // Keep old diagnostic rows out of the active conversational context.
  if (window.CalBuddy?.loadRecentConversationHistory) {
    const originalLoadRecentHistory = window.CalBuddy.loadRecentConversationHistory.bind(window.CalBuddy);
    window.CalBuddy.loadRecentConversationHistory = async () => {
      const history = await originalLoadRecentHistory();
      const filtered = [];

      for (let index = 0; index < history.length; index += 1) {
        const item = history[index];
        if (item?.role === "assistant" && isInternalFailureText(item?.content)) {
          if (filtered.at(-1)?.role === "user") filtered.pop();
          continue;
        }
        filtered.push(item);
      }

      return filtered;
    };
  }

  // Replace the legacy sender after home.js has loaded.
  sendAriMessage = resilientSendAriMessage;
  window.sendAriMessage = resilientSendAriMessage;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") schedulePendingRecovery();
  });

  window.addEventListener("pageshow", schedulePendingRecovery);
  window.addEventListener("focus", schedulePendingRecovery);

  // Recover a turn left pending by an earlier app suspension/crash.
  schedulePendingRecovery();
})();
