// =====================================================
// ARI XP
// File: js/home-resilience.js
// Version: 1.2.2
// Purpose:
//   Keep Ask Ari recoverable when an iOS WebView is backgrounded while routing
//   Home through the selected Ari runtime.
//   - Loads the vNext runtime controller before the first Ari request.
//   - Persists the in-flight user turn before network work begins.
//   - Reuses one stable turn ID across retries so the server can deduplicate.
//   - Never renders raw transport or deliberation diagnostics to users.
//   - Reconciles a completed Supabase conversation turn on resume.
//   - Retries one interrupted turn when no completed answer was saved.
//   - Filters internal failure markers from short-term conversation history.
//   - Surfaces deterministic vNext initiative messages in the same thread.
// =====================================================

(() => {
  "use strict";

  const PENDING_KEY = "arixp_pending_ari_turn_v1";
  const MAX_BACKGROUND_RETRIES = 1;
  const RESUME_DELAY_MS = 350;
  const RUNTIME_CONTROLLER_SRC = "ari/runtime/ari-runtime-controller.js?v=1.3.3";

  let requestInFlight = false;
  let recoveryTimer = null;
  let runtimeControllerPromise = null;
  let initiativeCheckScheduled = false;
  let lastRenderedInitiativeId = "";

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

  function loadRuntimeController() {
    if (window.AriRuntime?.ask) return Promise.resolve(window.AriRuntime);
    if (runtimeControllerPromise) return runtimeControllerPromise;

    runtimeControllerPromise = new Promise((resolve, reject) => {
      const existing = [...document.scripts].find((script) =>
        String(script.getAttribute("src") || "").includes("ari-runtime-controller.js")
      );
      const finish = () => {
        if (window.AriRuntime?.ask) resolve(window.AriRuntime);
        else reject(new Error("Ari runtime controller did not initialize."));
      };

      if (existing) {
        if (window.AriRuntime?.ask) {
          resolve(window.AriRuntime);
          return;
        }
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", () => reject(new Error("Ari runtime controller failed to load.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = RUNTIME_CONTROLLER_SRC;
      script.async = false;
      script.dataset.ariRuntimeController = "true";
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", () => reject(new Error("Ari runtime controller failed to load.")), { once: true });
      document.head.appendChild(script);
    });

    runtimeControllerPromise.catch(() => {
      runtimeControllerPromise = null;
    });
    return runtimeControllerPromise;
  }

  function readPendingTurn() {
    try {
      const saved = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
      if (!saved?.id || !saved?.message || !saved?.startedAt) return null;
      return saved;
    } catch {
      return null;
    }
  }

  function writePendingTurn(turn) {
    try { localStorage.setItem(PENDING_KEY, JSON.stringify(turn)); } catch {}
    return turn;
  }

  function clearPendingTurn() {
    try { localStorage.removeItem(PENDING_KEY); } catch {}
  }

  function createPendingTurn(message) {
    return writePendingTurn({
      id: typeof window.crypto?.randomUUID === "function"
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
    const selector = sender === "user" ? ".ari-message.ari-user p" : ".ari-message.ari-ai p";
    return [...document.querySelectorAll(selector)].some((node) => cleanText(node.textContent) === expected);
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
    if (!messageAlreadyRendered(reply, "ari")) addAriMessage(reply, "ari");
    rememberAssistantReply(pending.message, reply);
    if (response?.pendingAction) showPendingAction(response.pendingAction);
    clearPendingTurn();
    await refreshHomeDashboard();
    return true;
  }

  async function findSavedCompletedTurn(pending) {
    const client = window.calbuddySupabase || window.CalBuddy?.supabase;
    const session = await window.CalBuddy?.getCurrentSession?.();
    if (!client || !session?.user?.id) return null;

    try {
      const exact = await client
        .from("ari_conversation_turns")
        .select("turn_id,user_message,assistant_message,created_at")
        .eq("user_id", session.user.id)
        .eq("turn_id", pending.id)
        .limit(1);

      if (!exact?.error) {
        const row = Array.isArray(exact?.data) ? exact.data[0] : null;
        const reply = cleanText(row?.assistant_message);
        if (reply && !isInternalFailureText(reply)) return row;
      }

      const { data, error } = await client
        .from("ari_conversation_turns")
        .select("user_message,assistant_message,created_at")
        .eq("user_id", session.user.id)
        .eq("user_message", pending.message)
        .gte("created_at", pending.startedAt)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) return null;
      return (Array.isArray(data) ? data : []).find((turn) => {
        const reply = cleanText(turn?.assistant_message);
        return reply && !isInternalFailureText(reply);
      }) || null;
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
      await loadRuntimeController();
      const response = await CalBuddy.askAri({
        turnId: pending.id,
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
      if (!ariStopped && !readPendingTurn()) setAriComposerThinking(false);
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
      if (!messageAlreadyRendered(pending.message, "user")) addAriMessage(pending.message, "user");
      if (!messageAlreadyRendered(reply, "ari")) addAriMessage(reply, "ari");
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

  function renderInitiative(event) {
    const data = event?.detail || {};
    const initiative = data?.initiative || null;
    const opener = cleanText(initiative?.opener || initiative?.message || data?.opener);
    const initiativeId = cleanText(initiative?.id || initiative?.initiativeKey || data?.initiativeKey);
    if (!opener) return;
    if (initiativeId && initiativeId === lastRenderedInitiativeId) return;
    if (messageAlreadyRendered(opener, "ari")) return;

    lastRenderedInitiativeId = initiativeId;
    enterAriConversationMode();
    setAriPresenceFocus(false);
    addAriMessage(opener, "ari");
    ariChatHistory.push({ role: "assistant", content: opener });
    ariChatHistory = ariChatHistory.slice(-10);
    ariConversationStarted = true;
    ariFirstReplyCompleted = true;
  }

  function scheduleInitiativeCheck() {
    if (initiativeCheckScheduled) return;
    initiativeCheckScheduled = true;
    window.setTimeout(async () => {
      initiativeCheckScheduled = false;
      if (document.visibilityState === "hidden") return;
      try {
        const runtime = await loadRuntimeController();
        await runtime?.checkInitiative?.();
      } catch {}
    }, 1200);
  }

  if (window.CalBuddy?.saveConversationTurn) {
    const originalSaveConversationTurn = window.CalBuddy.saveConversationTurn.bind(window.CalBuddy);
    window.CalBuddy.saveConversationTurn = async (turn = {}) => {
      if (isInternalFailureText(turn?.reply)) return false;
      return await originalSaveConversationTurn(turn);
    };
  }

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

  sendAriMessage = resilientSendAriMessage;
  window.sendAriMessage = resilientSendAriMessage;
  window.addEventListener("ari:vnextInitiative", renderInitiative);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      schedulePendingRecovery();
      scheduleInitiativeCheck();
    }
  });
  window.addEventListener("pageshow", () => {
    schedulePendingRecovery();
    scheduleInitiativeCheck();
  });
  window.addEventListener("focus", () => {
    schedulePendingRecovery();
    scheduleInitiativeCheck();
  });

  void loadRuntimeController().catch(() => {});
  schedulePendingRecovery();
  scheduleInitiativeCheck();
})();
