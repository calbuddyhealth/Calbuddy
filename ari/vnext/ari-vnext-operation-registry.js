// ARI vNext — canonical trusted operation registry.
//
// This file loads after the existing vNext capability adapters. It captures the
// fully composed trusted adapter/executor stack once, then exposes one stable
// dispatch boundary for future capabilities. Existing capability behavior stays
// intact behind the fallback stack while new operations can register without
// monkey-patching AriVNextActionAdapter or CalBuddy.executeAction again.
//
// Trust invariants:
// - References and prior conversation may identify a target, never authorize it.
// - executeConfirmed still requires a turn-bound pending action and honors expiry.
// - Successful execution clears only the matching vNext/legacy pending copies.
// - Failed execution preserves pending state for retry.
// - Execution replies are normalized so typed/button confirmations share one
//   result contract regardless of which trusted domain executor produced it.
// - Structured Nutrition and manual-activity preparation enter through this
//   registry directly; their older adapter patches remain only as compatibility
//   fallbacks during the Phase 8 migration.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_operation_registry";
  const ADAPTER_FLAG = "__ariTrustedOperationRegistryV1";
  const APP_FLAG = "__ariTrustedApplicationExecutorRegistryV1";
  const NEXT = Object.freeze({ next: true });

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  function clean(value = "", max = 500) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function failure(code, message, extra = {}) {
    return { success: false, code, message, ...extra };
  }

  function pendingName(input = {}) {
    const pending = input?.vnextPendingAction || input;
    return clean(pending?.name, 120);
  }

  function actionType(action = {}) {
    return clean(action?.action_type || action?.type, 120);
  }

  function handlerSort(left, right) {
    return Number(right?.priority || 0) - Number(left?.priority || 0);
  }

  const operations = new Map();
  const applicationExecutors = new Map();
  const afterExecutionHooks = [];

  function operationList(name = "") {
    const key = clean(name, 120);
    if (!operations.has(key)) operations.set(key, []);
    return operations.get(key);
  }

  function executorList(type = "") {
    const key = clean(type, 120);
    if (!applicationExecutors.has(key)) applicationExecutors.set(key, []);
    return applicationExecutors.get(key);
  }

  function registerOperation(name = "", handlers = {}) {
    const key = clean(name, 120);
    if (!key) throw new Error("Ari operation name is required.");
    const entry = {
      source: clean(handlers?.source || SOURCE, 160),
      priority: Number(handlers?.priority || 0),
      match: typeof handlers?.match === "function" ? handlers.match : null,
      prepare: typeof handlers?.prepare === "function" ? handlers.prepare : null,
      createPending: typeof handlers?.createPending === "function" ? handlers.createPending : null,
      executeConfirmed: typeof handlers?.executeConfirmed === "function" ? handlers.executeConfirmed : null
    };
    if (!entry.prepare && !entry.createPending && !entry.executeConfirmed) {
      throw new Error(`Ari operation ${key} did not register a handler.`);
    }
    const list = operationList(key);
    list.push(entry);
    list.sort(handlerSort);
    return () => {
      const index = list.indexOf(entry);
      if (index >= 0) list.splice(index, 1);
    };
  }

  function registerApplicationExecutor(type = "", handler = {}) {
    const key = clean(type, 120);
    if (!key || typeof handler?.execute !== "function") {
      throw new Error("Ari application executor requires an action type and execute handler.");
    }
    const entry = {
      source: clean(handler?.source || SOURCE, 160),
      priority: Number(handler?.priority || 0),
      match: typeof handler?.match === "function" ? handler.match : null,
      execute: handler.execute
    };
    const list = executorList(key);
    list.push(entry);
    list.sort(handlerSort);
    return () => {
      const index = list.indexOf(entry);
      if (index >= 0) list.splice(index, 1);
    };
  }

  function registerAfterExecution(handler, options = {}) {
    if (typeof handler !== "function") throw new Error("Ari after-execution hook must be a function.");
    const entry = {
      handler,
      source: clean(options?.source || SOURCE, 160),
      priority: Number(options?.priority || 0)
    };
    afterExecutionHooks.push(entry);
    afterExecutionHooks.sort(handlerSort);
    return () => {
      const index = afterExecutionHooks.indexOf(entry);
      if (index >= 0) afterExecutionHooks.splice(index, 1);
    };
  }

  function matchingHandlers(name = "", stage = "", input = {}) {
    return (operations.get(clean(name, 120)) || []).filter((entry) => {
      if (typeof entry?.[stage] !== "function") return false;
      if (!entry.match) return true;
      try { return entry.match(input) === true; } catch { return false; }
    });
  }

  function matchingExecutors(type = "", action = {}) {
    return (applicationExecutors.get(clean(type, 120)) || []).filter((entry) => {
      if (!entry.match) return true;
      try { return entry.match(action) === true; } catch { return false; }
    });
  }

  async function dispatchOperation(stage, input, fallback) {
    const name = pendingName(input);
    const handlers = matchingHandlers(name, stage, input);
    for (const entry of handlers) {
      const result = await entry[stage](input, { NEXT, source: entry.source });
      if (result !== NEXT && result !== undefined) return result;
    }
    return await fallback(input);
  }

  async function dispatchApplicationAction(action, fallback) {
    const type = actionType(action);
    const handlers = matchingExecutors(type, action);
    for (const entry of handlers) {
      const result = await entry.execute(action, { NEXT, source: entry.source });
      if (result !== NEXT && result !== undefined) return result;
    }
    return await fallback(action);
  }

  function normalizedReply(execution = {}) {
    const candidates = [
      execution?.reply,
      execution?.result?.reply,
      execution?.result?.result?.reply,
      execution?.result?.message,
      execution?.message
    ];
    return candidates.map((value) => clean(value, 2000)).find(Boolean) || "";
  }

  function normalizeExecution(execution = {}) {
    if (!execution || typeof execution !== "object" || Array.isArray(execution)) {
      return failure("invalid_execution_result", "The trusted executor returned an invalid result.");
    }

    const success = execution.success !== false;
    const reply = normalizedReply(execution);
    let result = execution.result;

    // Runtime typed confirmation historically reads execution.result.reply while
    // some trusted executors return reply at the top level. Preserve the original
    // result and mirror the reply into that shape so both paths are equivalent.
    if (reply) {
      if (result && typeof result === "object" && !Array.isArray(result)) {
        if (!clean(result.reply, 2000)) result = { ...result, reply };
      } else if (result === null || result === undefined) {
        result = { reply };
      }
    }

    return {
      ...execution,
      success,
      ...(result !== undefined ? { result } : {}),
      ...(reply ? { reply } : {})
    };
  }

  function clearMatchingPendingCopies(pendingAction = null) {
    const pendingId = clean(pendingAction?.id, 220);
    if (!pendingId) return false;

    const bridge = window.AriVNextBridge;
    const bridgePending = bridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id, 220) === pendingId) bridge?.clearPendingAction?.();

    const CalBuddy = window.CalBuddy;
    const legacyPending = CalBuddy?.getPendingAction?.() || null;
    if (clean(legacyPending?.vnext_action_id, 220) === pendingId) CalBuddy?.clearPendingAction?.();
    return true;
  }

  function reconcileOrphanedLegacyPending() {
    const CalBuddy = window.CalBuddy;
    const bridge = window.AriVNextBridge;
    if (!CalBuddy?.getPendingAction || !CalBuddy?.clearPendingAction || !bridge?.getPendingAction) return false;

    const legacyPending = CalBuddy.getPendingAction() || null;
    const linkedId = clean(legacyPending?.vnext_action_id, 220);
    if (!linkedId) return false;

    const bridgePending = bridge.getPendingAction() || null;
    if (clean(bridgePending?.id, 220) === linkedId) return false;

    CalBuddy.clearPendingAction();
    return true;
  }

  async function runAfterExecution(input = {}, execution = {}) {
    let current = execution;
    for (const entry of afterExecutionHooks) {
      try {
        const next = await entry.handler(input, current);
        if (next && typeof next === "object" && !Array.isArray(next)) current = next;
      } catch (error) {
        console.warn("[Ari Operation Registry] after-execution hook failed:", entry.source, error?.message || error);
      }
    }
    return current;
  }

  function registerBuiltInDelegates() {
    const nutrition = window.AriVNextNutritionResolutionAdapter;
    if (nutrition?.ready === true && typeof nutrition.resolveMeal === "function") {
      registerOperation("log_meal", {
        source: "ari_vnext_nutrition_resolution_adapter",
        priority: 1000,
        match(pending = {}) {
          return Array.isArray(pending?.arguments?.items);
        },
        async prepare(pending = {}) {
          return await nutrition.resolveMeal(pending);
        }
      });
    }

    const activity = window.AriVNextActivityAdapter;
    if (activity && typeof activity.prepare === "function") {
      registerOperation("log_activity", {
        source: "ari_vnext_activity_adapter",
        priority: 900,
        async prepare(pending = {}) {
          return await activity.prepare(pending, pending?.arguments || {});
        }
      });
    }
  }

  function snapshot() {
    return {
      version: VERSION,
      operationNames: [...operations.keys()].sort(),
      applicationActionTypes: [...applicationExecutors.keys()].sort(),
      afterExecutionHooks: afterExecutionHooks.map((entry) => entry.source)
    };
  }

  function install() {
    const adapter = window.AriVNextActionAdapter;
    const CalBuddy = window.CalBuddy;
    if (!adapter || !CalBuddy) return false;
    if (window.AriVNextOperationRegistry?.ready === true) return true;
    if (
      typeof adapter.prepareCalBuddyAction !== "function" ||
      typeof adapter.createCalBuddyPendingAction !== "function" ||
      typeof adapter.executeConfirmed !== "function" ||
      typeof CalBuddy.executeAction !== "function"
    ) return false;

    const fallback = Object.freeze({
      prepare: adapter.prepareCalBuddyAction.bind(adapter),
      createPending: adapter.createCalBuddyPendingAction.bind(adapter),
      executeConfirmed: adapter.executeConfirmed.bind(adapter),
      applicationExecute: CalBuddy.executeAction.bind(CalBuddy)
    });

    adapter.prepareCalBuddyAction = async function registeredPrepare(pendingAction = {}) {
      return await dispatchOperation("prepare", pendingAction, fallback.prepare);
    };

    adapter.createCalBuddyPendingAction = async function registeredPendingCreate(pendingAction = {}) {
      return await dispatchOperation("createPending", pendingAction, fallback.createPending);
    };

    adapter.executeConfirmed = async function registeredConfirmedExecution(input = {}) {
      const pendingAction = input?.vnextPendingAction || null;
      if (!pendingAction?.id || !pendingAction?.sourceTurnId) {
        return failure("missing_vnext_pending_action", "There is no turn-bound vNext action to execute.");
      }
      if (pendingAction?.expiresAt && Date.parse(pendingAction.expiresAt) < Date.now()) {
        return failure("vnext_action_expired", "That pending change expired. Ask Ari to prepare it again.");
      }

      let execution = await dispatchOperation("executeConfirmed", input, fallback.executeConfirmed);
      execution = normalizeExecution(execution);
      execution = normalizeExecution(await runAfterExecution(input, execution));

      if (execution.success === true) clearMatchingPendingCopies(pendingAction);

      try {
        window.dispatchEvent(new CustomEvent("ari:vnextOperationExecuted", {
          detail: {
            version: VERSION,
            operation: pendingName(input),
            success: execution.success === true,
            code: clean(execution?.code, 120) || null
          }
        }));
      } catch {}

      return execution;
    };

    CalBuddy.executeAction = async function registeredApplicationExecutor(action = {}) {
      return await dispatchApplicationAction(action, fallback.applicationExecute);
    };

    Object.defineProperty(adapter, ADAPTER_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });
    Object.defineProperty(CalBuddy, APP_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });

    registerBuiltInDelegates();

    const registryTarget = {};
    const registryCore = {
      version: VERSION,
      source: SOURCE,
      ready: true,
      NEXT,
      registerOperation,
      registerApplicationExecutor,
      registerAfterExecution,
      normalizeExecution,
      reconcileOrphanedLegacyPending,
      snapshot
    };
    for (const [key, value] of Object.entries(registryCore)) {
      Object.defineProperty(registryTarget, key, {
        configurable: false,
        enumerable: true,
        writable: false,
        value
      });
    }

    // Core registry authority is immutable. Migration modules may attach only
    // private non-enumerable install markers; they cannot replace registry APIs.
    window.AriVNextOperationRegistry = new Proxy(registryTarget, {
      defineProperty(target, property, descriptor = {}) {
        const key = typeof property === "string" ? property : "";
        if (!/^__ariOperationRegistry[A-Za-z0-9_]*$/.test(key) || Reflect.has(target, property)) return false;
        return Reflect.defineProperty(target, property, {
          configurable: false,
          enumerable: false,
          writable: false,
          value: descriptor.value
        });
      },
      set() { return false; },
      deleteProperty() { return false; }
    });

    reconcileOrphanedLegacyPending();
    window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryReady", {
      detail: { version: VERSION, source: SOURCE, operations: snapshot().operationNames }
    }));
    return true;
  }

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 25);
  }
})();