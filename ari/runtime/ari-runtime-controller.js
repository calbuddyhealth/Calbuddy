// =====================================================
// ARI XP
// File: ari/runtime/ari-runtime-controller.js
// Version: 1.4.2
// Purpose:
//   Make Ari vNext the default Home + Nutrition intelligence runtime while
//   preserving Rebirth as a deterministic emergency fallback during cutover.
//
// Contract:
//   - vNext is the default runtime.
//   - The runtime controller owns the ordered vNext dependency boot sequence.
//   - Rebirth remains available by local emergency override.
//   - A vNext transport/runtime failure falls back once to Rebirth.
//   - Existing trusted CalBuddy action execution remains authoritative.
//   - Typed and button confirmations share the same trusted action boundary.
//   - vNext experiment actions keep their authenticated ledger lifecycle.
//   - vNext manual activity logs use the shared Training activity writer.
//   - vNext Meal Plan proposals use the trusted today-only Meal Plan adapter.
//   - A bounded reference lifecycle binds recent conversation to trusted app objects.
//   - The final initiative/capability bootstrap must satisfy its minimum version
//     before vNext can report itself ready.
//   - Initiative checks are deterministic and do not spend an LLM call.
//   - ask() accepts both legacy object input and message/options input without
//     ever stringifying the request object into "[object Object]".
//   - The canonical CalBuddy user context is passed to the vNext bridge under
//     userContext so personalization is not silently discarded.
//   - Narrow greetings skip heavy browser-side profile/nutrition hydration.
//   - Expired vNext-linked legacy actions can never execute as a fallback.
//   - window.Ari.Runtime is canonical and window.AriRuntime is a compatibility
//     alias for Home/iOS callers during the cutover.
//   - Abort and in-progress transport states never fall through to Rebirth.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.4.2";
  const MODE_KEY = "ari_runtime_mode_v1";
  const DEFAULT_MODE = "vnext";
  const ALLOWED_MODES = new Set(["vnext", "rebirth"]);
  const VNEXT_SCRIPTS = [
    "ari/vnext/ari-vnext-training-context.js?v=1.0.0",
    "ari/vnext/ari-vnext-action-adapter.js?v=1.3.0",
    "ari/vnext/ari-vnext-activity-adapter.js?v=1.1.0",
    "ari/vnext/ari-vnext-meal-plan-adapter.js?v=1.0.1",
    "ari/vnext/ari-vnext-bridge.js?v=1.7.2",
    "ari/vnext/ari-vnext-context-guard.js?v=1.2.2",
    "ari/vnext/ari-vnext-reference-state.js?v=1.2.0",
    "ari/vnext/ari-vnext-initiative.js?v=1.1.0"
  ];

  const legacy = {
    askAri: typeof CalBuddy.askAri === "function" ? CalBuddy.askAri.bind(CalBuddy) : null,
    confirmPendingAction:
      typeof CalBuddy.confirmPendingAction === "function"
        ? CalBuddy.confirmPendingAction.bind(CalBuddy)
        : null,
    cancelPendingAction:
      typeof CalBuddy.cancelPendingAction === "function"
        ? CalBuddy.cancelPendingAction.bind(CalBuddy)
        : null
  };

  let dependencyPromise = null;
  let initiativeCheckPromise = null;
  let activeInitiative = null;

  function clean(value = "") {
    return String(value || "").trim();
  }

  function versionAtLeast(actual = "", required = "") {
    const normalize = (value) => String(value || "")
      .split(".")
      .map((part) => Number.parseInt(part, 10) || 0);
    const left = normalize(actual);
    const right = normalize(required);
    const length = Math.max(left.length, right.length);
    for (let index = 0; index < length; index += 1) {
      const a = left[index] || 0;
      const b = right[index] || 0;
      if (a > b) return true;
      if (a < b) return false;
    }
    return true;
  }

  function makeAbortError() {
    const error = new Error("Ari request was cancelled.");
    error.name = "AbortError";
    error.code = "ARI_REQUEST_ABORTED";
    return error;
  }

  function throwIfAborted(signal = null) {
    if (signal?.aborted) throw makeAbortError();
  }

  function awaitWithSignal(promise, signal = null) {
    if (!signal) return promise;
    if (signal.aborted) return Promise.reject(makeAbortError());
    return new Promise((resolve, reject) => {
      const onAbort = () => reject(makeAbortError());
      signal.addEventListener("abort", onAbort, { once: true });
      promise.then(
        (value) => {
          signal.removeEventListener("abort", onAbort);
          resolve(value);
        },
        (error) => {
          signal.removeEventListener("abort", onAbort);
          reject(error);
        }
      );
    });
  }

  function normalizeAskRequest(messageOrInput = "", options = {}) {
    const objectInput =
      messageOrInput &&
      typeof messageOrInput === "object" &&
      !Array.isArray(messageOrInput)
        ? messageOrInput
        : null;

    const input = objectInput
      ? { ...objectInput, ...(options && typeof options === "object" ? options : {}) }
      : {
          ...(options && typeof options === "object" ? options : {}),
          message: messageOrInput
        };

    const message = clean(input?.message);
    const history = Array.isArray(input?.history) ? input.history : [];

    return {
      input: {
        ...input,
        message,
        history
      },
      message,
      history
    };
  }

  function isCasualConversation(message = "") {
    const text = clean(message);
    if (!text || text.length > 140) return false;
    return /^(?:(?:hey|hi|hello|yo)(?:\s+ari)?|(?:hey|hi|hello|yo)\s+there|what(?:'s| is)\s+up(?:\s+ari)?|sup(?:\s+ari)?|good\s+(?:morning|afternoon|evening)(?:\s+ari)?|how\s+are\s+you(?:\s+doing)?(?:\s+ari)?|thanks(?:\s+ari)?|thank\s+you(?:\s+ari)?)[!.?\s]*$/i.test(text);
  }

  function safeMode(value) {
    const normalized = clean(value).toLowerCase();
    return ALLOWED_MODES.has(normalized) ? normalized : DEFAULT_MODE;
  }

  function getMode() {
    try {
      return safeMode(localStorage.getItem(MODE_KEY) || DEFAULT_MODE);
    } catch {
      return DEFAULT_MODE;
    }
  }

  function setMode(mode) {
    const next = safeMode(mode);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // Storage restrictions must not prevent runtime selection.
    }
    window.dispatchEvent(
      new CustomEvent("ari:runtimeChanged", { detail: { mode: next, version: VERSION } })
    );
    return next;
  }

  function dependencyBase(src = "") {
    return String(src || "").split("?")[0];
  }

  function dependencyReady(src = "") {
    const base = dependencyBase(src);
    if (base.endsWith("ari-vnext-training-context.js")) return Boolean(window.AriVNextTrainingContext);
    if (base.endsWith("ari-vnext-action-adapter.js")) return Boolean(window.AriVNextActionAdapter);
    if (base.endsWith("ari-vnext-activity-adapter.js")) {
      return Boolean(window.AriVNextActivityAdapter) &&
        versionAtLeast(window.AriVNextActivityAdapter?.version, "1.1.0");
    }
    if (base.endsWith("ari-vnext-meal-plan-adapter.js")) return window.AriVNextMealPlanAdapter?.ready === true;
    if (base.endsWith("ari-vnext-bridge.js")) {
      return typeof window.AriVNextBridge?.ask === "function" &&
        versionAtLeast(window.AriVNextBridge?.version, "1.7.2");
    }
    if (base.endsWith("ari-vnext-context-guard.js")) return window.AriVNextContextGuard?.ready === true;
    if (base.endsWith("ari-vnext-reference-state.js")) {
      return window.AriVNextReferenceState?.ready === true &&
        versionAtLeast(window.AriVNextReferenceState?.version, "1.2.0");
    }
    if (base.endsWith("ari-vnext-initiative.js")) {
      return Boolean(window.AriVNextInitiative) &&
        versionAtLeast(window.AriVNextInitiative?.version, "1.1.0");
    }
    return true;
  }

  async function waitForDependency(src, timeoutMs = 5000) {
    if (dependencyReady(src)) return true;
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      await new Promise((resolve) => window.setTimeout(resolve, 25));
      if (dependencyReady(src)) return true;
    }
    throw new Error(`Ari vNext dependency did not initialize: ${dependencyBase(src)}`);
  }

  function loadScript(src) {
    if (dependencyReady(src)) return Promise.resolve(true);

    const exact = [...document.scripts].find((script) => {
      const current = String(script.getAttribute("src") || "");
      return current === src || current.endsWith(`/${src}`) || current.includes(src);
    });
    if (exact) return Promise.resolve(true);

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.dataset.ariRuntimeDependency = "vnext";
      script.addEventListener("load", () => resolve(true), { once: true });
      script.addEventListener(
        "error",
        () => reject(new Error(`Could not load ${dependencyBase(src)}.`)),
        { once: true }
      );
      document.head.appendChild(script);
    });
  }

  function vNextReady() {
    return Boolean(
      typeof window.AriVNextBridge?.ask === "function" &&
      versionAtLeast(window.AriVNextBridge?.version, "1.7.2") &&
      window.AriVNextActionAdapter &&
      window.AriVNextActivityAdapter &&
      versionAtLeast(window.AriVNextActivityAdapter?.version, "1.1.0") &&
      window.AriVNextMealPlanAdapter?.ready === true &&
      window.AriVNextContextGuard?.ready === true &&
      window.AriVNextReferenceState?.ready === true &&
      versionAtLeast(window.AriVNextReferenceState?.version, "1.2.0") &&
      window.AriVNextInitiative &&
      versionAtLeast(window.AriVNextInitiative?.version, "1.1.0")
    );
  }

  async function ensureVNext(signal = null) {
    throwIfAborted(signal);
    if (vNextReady()) return true;

    if (!dependencyPromise) {
      dependencyPromise = (async () => {
        for (const src of VNEXT_SCRIPTS) {
          await loadScript(src);
          await waitForDependency(src);
        }

        if (!vNextReady()) {
          throw new Error("Ari vNext brain stack did not initialize completely.");
        }
        return true;
      })();

      dependencyPromise.catch(() => {
        dependencyPromise = null;
      });
    }

    const ready = await awaitWithSignal(dependencyPromise, signal);
    throwIfAborted(signal);
    return ready;
  }

  async function getUserContext() {
    try {
      if (typeof CalBuddy.getUserContext === "function") {
        return (await CalBuddy.getUserContext()) || {};
      }
    } catch (error) {
      console.warn("Ari vNext user context unavailable:", error?.message || error);
    }
    return {};
  }

  function isExperimentAction(name = "") {
    return ["track_experiment", "complete_experiment", "cancel_experiment"].includes(
      clean(name)
    );
  }

  function experimentConfirmationText(pending = {}) {
    if (pending?.name === "track_experiment") return "Start tracking this experiment?";
    if (pending?.name === "complete_experiment") return "Save this experiment result?";
    if (pending?.name === "cancel_experiment") return "Cancel this experiment?";
    return "Confirm this Ari change?";
  }

  async function normalizePendingAction(result = {}) {
    const pending = result?.pendingAction;
    if (!pending?.id || !pending?.name) return result;

    if (isExperimentAction(pending.name)) {
      return {
        ...result,
        pendingAction: {
          ...pending,
          confirmation_text: experimentConfirmationText(pending)
        }
      };
    }

    const mapped = await window.AriVNextActionAdapter.createCalBuddyPendingAction(pending);
    if (!mapped?.success || !mapped?.action) {
      console.warn(
        "Ari vNext action mapping blocked:",
        mapped?.code || mapped?.message || "unknown mapping error"
      );
      return {
        ...result,
        pendingAction: null,
        actionMapping: {
          success: false,
          code: mapped?.code || "mapping_failed",
          message: mapped?.message || "That change could not be prepared safely."
        }
      };
    }

    return {
      ...result,
      pendingAction: mapped.action,
      vnextPendingAction: pending,
      actionMapping: {
        success: true,
        resolution: mapped?.resolution || null
      }
    };
  }

  async function markInitiativeEngaged() {
    const initiative = activeInitiative;
    if (!initiative?.id || !window.AriVNextInitiative?.engage) return;
    activeInitiative = null;
    try {
      await window.AriVNextInitiative.engage(initiative);
    } catch {
      // Engagement bookkeeping must never block the user's reply.
    }
  }

  async function executeTypedConfirmation(result = {}) {
    const actionType = clean(result?.action?.type);
    const pending = result?.pendingAction || null;

    if (actionType === "cancel_pending_action") {
      if (legacy.cancelPendingAction && CalBuddy.getPendingAction?.()) {
        legacy.cancelPendingAction();
      }
      window.AriVNextBridge?.clearPendingAction?.();
      return { ...result, pendingAction: null };
    }

    if (actionType !== "execute_pending_action" || !pending?.id) return result;

    if (isExperimentAction(pending.name)) {
      const response = await executeExperimentAction(pending);
      window.AriVNextBridge?.clearPendingAction?.();
      return {
        ...result,
        reply: response?.reply || result.reply,
        pendingAction: null,
        execution: response
      };
    }

    const originalPending = result?.vnextPendingAction || window.AriVNextBridge?.getPendingAction?.();
    if (!originalPending?.id) return result;

    const execution = await window.AriVNextActionAdapter.executeConfirmed({
      vnextPendingAction: originalPending,
      currentTurnId: result?.turn?.turnId || result?.turnId || null
    });
    window.AriVNextBridge?.clearPendingAction?.();

    if (!execution?.success) {
      return {
        ...result,
        pendingAction: null,
        execution,
        reply: execution?.message || "That change could not be completed."
      };
    }

    return {
      ...result,
      pendingAction: null,
      execution,
      reply: execution?.result?.reply || result.reply
    };
  }

  async function executeExperimentAction(pending = {}) {
    const name = clean(pending?.name);
    const args = pending?.arguments && typeof pending.arguments === "object" ? pending.arguments : {};
    const map = {
      track_experiment: { path: "/api/ari-vnext-experiments", body: { action: "start", hypothesisId: args.hypothesisId } },
      complete_experiment: {
        path: "/api/ari-vnext-experiments",
        body: {
          action: "complete",
          experimentId: args.experimentId,
          outcomeDirection: args.outcomeDirection,
          summary: args.summary,
          confidenceAfter: args.confidenceAfter
        }
      },
      cancel_experiment: { path: "/api/ari-vnext-experiments", body: { action: "cancel", experimentId: args.experimentId, reason: args.reason } }
    };
    const request = map[name];
    if (!request) return { success: false, message: "Unsupported Ari experiment action." };

    const session = await window.CalBuddy?.getCurrentSession?.();
    const token = session?.access_token || null;
    const response = await fetch(request.path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(request.body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      return { success: false, message: payload?.error || "The Ari experiment could not be updated." };
    }
    return { success: true, reply: payload?.reply || "Experiment updated." };
  }

  function isExpiredVNextLegacyPending(action = null) {
    if (!action || typeof action !== "object") return false;
    const linked = Boolean(
      action?.vnext_action_id ||
      action?.vnext_source_turn_id ||
      clean(action?.vnext_source) === "ari_vnext_action_adapter"
    );
    if (!linked) return false;

    const expiresAt = Date.parse(String(action?.vnext_expires_at || ""));
    return Number.isFinite(expiresAt) && expiresAt <= Date.now();
  }

  function shouldPropagateTransportError(error) {
    return Boolean(
      error?.name === "AbortError" ||
      error?.code === "ARI_REQUEST_ABORTED" ||
      error?.code === "ARI_TURN_IN_PROGRESS"
    );
  }

  async function ask(messageOrInput = "", options = {}) {
    const request = normalizeAskRequest(messageOrInput, options);
    const { input, message } = request;
    const signal = input?.signal || null;

    if (!message) {
      return { success: false, ready: false, reply: "Say something first." };
    }

    throwIfAborted(signal);

    const mode = getMode();
    if (mode !== "vnext") {
      if (!legacy.askAri) throw new Error("Ari Rebirth fallback is unavailable.");
      return await legacy.askAri(input);
    }

    try {
      await ensureVNext(signal);
      throwIfAborted(signal);
      await markInitiativeEngaged();
      throwIfAborted(signal);

      const casualConversation = isCasualConversation(message);
      const userContext =
        input?.userContext ||
        input?.context ||
        (casualConversation ? {} : await getUserContext());

      throwIfAborted(signal);

      let result = await window.AriVNextBridge.ask(message, {
        ...input,
        userContext,
        casualConversation,
        signal
      });
      throwIfAborted(signal);
      result = await normalizePendingAction(result);
      result = await executeTypedConfirmation(result);
      return result;
    } catch (error) {
      if (shouldPropagateTransportError(error)) throw error;
      console.error("Ari vNext runtime failed; using Rebirth fallback:", error);
      if (!legacy.askAri) throw error;
      return await legacy.askAri(input);
    }
  }

  async function confirmPendingAction() {
    const pending = window.AriVNextBridge?.getPendingAction?.();
    const legacyPending = CalBuddy.getPendingAction?.() || null;
    if (getMode() === "vnext" && !pending?.id && isExpiredVNextLegacyPending(legacyPending)) {
      legacy.cancelPendingAction?.();
      return {
        success: false,
        expired: true,
        reply: "That pending change expired. Ask Ari to prepare it again."
      };
    }

    if (getMode() !== "vnext" || !pending?.id) {
      return legacy.confirmPendingAction ? await legacy.confirmPendingAction() : null;
    }

    if (isExperimentAction(pending.name)) {
      const response = await executeExperimentAction(pending);
      if (response?.success) window.AriVNextBridge?.clearPendingAction?.();
      return response;
    }

    const execution = await window.AriVNextActionAdapter.executeConfirmed({
      vnextPendingAction: pending,
      currentTurnId: null
    });
    if (execution?.success) window.AriVNextBridge?.clearPendingAction?.();
    return execution;
  }

  function cancelPendingAction() {
    if (getMode() !== "vnext") return legacy.cancelPendingAction?.();
    window.AriVNextBridge?.clearPendingAction?.();
    if (CalBuddy.getPendingAction?.()) legacy.cancelPendingAction?.();
    return true;
  }

  async function checkInitiative(options = {}) {
    if (getMode() !== "vnext") return null;
    try {
      await ensureVNext();
      if (!window.AriVNextInitiative?.check) return null;
      if (initiativeCheckPromise) return await initiativeCheckPromise;
      initiativeCheckPromise = window.AriVNextInitiative.check(options);
      const result = await initiativeCheckPromise;
      activeInitiative = result?.initiative || null;
      return result;
    } catch (error) {
      console.warn("Ari vNext initiative check failed:", error?.message || error);
      return null;
    } finally {
      initiativeCheckPromise = null;
    }
  }

  CalBuddy.askAri = ask;
  CalBuddy.confirmPendingAction = confirmPendingAction;
  CalBuddy.cancelPendingAction = cancelPendingAction;
  CalBuddy.setAriRuntimeMode = setMode;
  CalBuddy.getAriRuntimeMode = getMode;
  CalBuddy.checkAriInitiative = checkInitiative;

  const runtimeApi = Object.freeze({
    version: VERSION,
    ask,
    ensureVNext,
    checkInitiative,
    getMode,
    setMode
  });

  window.Ari.Runtime = runtimeApi;
  window.AriRuntime = runtimeApi;
  window.dispatchEvent(
    new CustomEvent("ari:runtimeReady", {
      detail: { version: VERSION, runtime: "vnext", source: "ari-runtime-controller" }
    })
  );
})();