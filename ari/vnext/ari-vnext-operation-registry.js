// ARI vNext — canonical trusted operation registry.
// Permanent domain handlers register here; runtime calls this boundary directly.

(() => {
  "use strict";

  const VERSION = "2.0.1";
  const SOURCE = "ari_vnext_operation_registry";
  const NEXT = Object.freeze({ next: true });
  const operations = new Map();
  const applicationExecutors = new Map();
  const afterExecutionHooks = [];

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  function clean(value = "", max = 500) { return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max); }
  function failure(code, message, extra = {}) { return { success: false, code, message, ...extra }; }
  function pendingFrom(input = {}) { return input?.vnextPendingAction || input || {}; }
  function pendingName(input = {}) { return clean(pendingFrom(input)?.name, 120); }
  function actionType(action = {}) { return clean(action?.action_type || action?.type, 120); }
  function handlerSort(left, right) { return Number(right?.priority || 0) - Number(left?.priority || 0); }
  function listFor(map, key) { if (!map.has(key)) map.set(key, []); return map.get(key); }

  function registerOperation(name = "", handlers = {}) {
    const key = clean(name, 120);
    if (!key) throw new Error("Ari operation name is required.");
    const entry = { source: clean(handlers?.source || SOURCE, 160), priority: Number(handlers?.priority || 0), match: typeof handlers?.match === "function" ? handlers.match : null, prepare: typeof handlers?.prepare === "function" ? handlers.prepare : null, createPending: typeof handlers?.createPending === "function" ? handlers.createPending : null, executeConfirmed: typeof handlers?.executeConfirmed === "function" ? handlers.executeConfirmed : null };
    if (!entry.prepare && !entry.createPending && !entry.executeConfirmed) throw new Error(`Ari operation ${key} did not register a handler.`);
    const list = listFor(operations, key); list.push(entry); list.sort(handlerSort);
    return () => { const index = list.indexOf(entry); if (index >= 0) list.splice(index, 1); };
  }

  function registerApplicationExecutor(type = "", handler = {}) {
    const key = clean(type, 120);
    if (!key || typeof handler?.execute !== "function") throw new Error("Ari application executor requires an action type and execute handler.");
    const entry = { source: clean(handler?.source || SOURCE, 160), priority: Number(handler?.priority || 0), match: typeof handler?.match === "function" ? handler.match : null, execute: handler.execute };
    const list = listFor(applicationExecutors, key); list.push(entry); list.sort(handlerSort);
    return () => { const index = list.indexOf(entry); if (index >= 0) list.splice(index, 1); };
  }

  function registerAfterExecution(handler, options = {}) {
    if (typeof handler !== "function") throw new Error("Ari after-execution hook must be a function.");
    const entry = { handler, source: clean(options?.source || SOURCE, 160), priority: Number(options?.priority || 0) };
    afterExecutionHooks.push(entry); afterExecutionHooks.sort(handlerSort);
    return () => { const index = afterExecutionHooks.indexOf(entry); if (index >= 0) afterExecutionHooks.splice(index, 1); };
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

  async function dispatchOperation(stage, input = {}) {
    const name = pendingName(input);
    if (!name) return failure("operation_name_required", "Ari could not identify that operation.");
    const handlers = matchingHandlers(name, stage, input);
    for (const entry of handlers) {
      const result = await entry[stage](input, { NEXT, source: entry.source });
      if (result !== NEXT && result !== undefined) return result;
    }
    return failure("operation_handler_unavailable", `No permanent ${stage} handler is registered for ${name}.`, { operation: name, stage });
  }

  async function executeApplication(action = {}) {
    const type = actionType(action);
    const handlers = matchingExecutors(type, action);
    for (const entry of handlers) {
      const result = await entry.execute(action, { NEXT, source: entry.source });
      if (result !== NEXT && result !== undefined) return result;
    }
    return failure("application_executor_unavailable", `No permanent application executor is registered for ${type || "that action"}.`);
  }

  function normalizedReply(execution = {}) {
    return [execution?.reply, execution?.result?.reply, execution?.result?.result?.reply, execution?.result?.message, execution?.message].map((value) => clean(value, 2000)).find(Boolean) || "";
  }

  function normalizeExecution(execution = {}) {
    if (!execution || typeof execution !== "object" || Array.isArray(execution)) return failure("invalid_execution_result", "The trusted executor returned an invalid result.");
    const success = execution.success !== false;
    const reply = normalizedReply(execution);
    let result = execution.result;
    if (reply) {
      if (result && typeof result === "object" && !Array.isArray(result) && !clean(result.reply, 2000)) result = { ...result, reply };
      else if (result == null) result = { reply };
    }
    return { ...execution, success, ...(result !== undefined ? { result } : {}), ...(reply ? { reply } : {}) };
  }

  function clearMatchingPendingCopies(pendingAction = null) {
    const pendingId = clean(pendingAction?.id, 220); if (!pendingId) return false;
    const bridgePending = window.AriVNextBridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id, 220) === pendingId) window.AriVNextBridge?.clearPendingAction?.();
    const legacyPending = window.CalBuddy?.getPendingAction?.() || null;
    if (clean(legacyPending?.vnext_action_id, 220) === pendingId) window.CalBuddy?.clearPendingAction?.();
    return true;
  }

  function reconcileOrphanedLegacyPending() {
    const legacyPending = window.CalBuddy?.getPendingAction?.() || null;
    const linkedId = clean(legacyPending?.vnext_action_id, 220); if (!linkedId) return false;
    const bridgePending = window.AriVNextBridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id, 220) === linkedId) return false;
    window.CalBuddy?.clearPendingAction?.(); return true;
  }

  async function runAfterExecution(input = {}, execution = {}) {
    let current = execution;
    for (const entry of afterExecutionHooks) {
      try { const next = await entry.handler(input, current); if (next && typeof next === "object" && !Array.isArray(next)) current = next; }
      catch (error) { console.warn("[Ari Operation Registry] after-execution hook failed:", entry.source, error?.message || error); }
    }
    return current;
  }

  async function prepare(pendingAction = {}) { return await dispatchOperation("prepare", pendingAction); }
  async function createPending(pendingAction = {}) { return await dispatchOperation("createPending", pendingAction); }
  async function executeConfirmed(input = {}) {
    const pendingAction = pendingFrom(input);
    if (!pendingAction?.id || !pendingAction?.sourceTurnId) return failure("missing_vnext_pending_action", "There is no turn-bound vNext action to execute.");
    if (pendingAction?.expiresAt && Date.parse(pendingAction.expiresAt) < Date.now()) return failure("vnext_action_expired", "That pending change expired. Ask Ari to prepare it again.");
    let execution = normalizeExecution(await dispatchOperation("executeConfirmed", input));
    execution = normalizeExecution(await runAfterExecution(input, execution));
    if (execution.success === true) clearMatchingPendingCopies(pendingAction);
    try { window.dispatchEvent(new CustomEvent("ari:vnextOperationExecuted", { detail: { version: VERSION, operation: pendingName(input), success: execution.success === true, code: clean(execution?.code, 120) || null } })); } catch {}
    return execution;
  }

  function snapshot() { return { version: VERSION, operationNames: [...operations.keys()].sort(), applicationActionTypes: [...applicationExecutors.keys()].sort(), afterExecutionHooks: afterExecutionHooks.map((entry) => entry.source) }; }

  const registry = Object.freeze({ version: VERSION, source: SOURCE, ready: true, NEXT, registerOperation, registerApplicationExecutor, registerAfterExecution, prepare, createPending, executeConfirmed, executeApplication, normalizeExecution, reconcileOrphanedLegacyPending, snapshot });
  window.AriVNextOperationRegistry = registry;

  // Temporary API-name compatibility only. Runtime/older continuity code may still
  // call AriVNextActionAdapter while their source-shape contracts are being retired;
  // all authority now delegates into this registry and no legacy mapper executes.
  const compatibility = window.AriVNextActionAdapter || {};
  compatibility.version = "registry-facade-1.0.0";
  compatibility.source = "ari_vnext_operation_registry_facade";
  compatibility.prepareCalBuddyAction = prepare;
  compatibility.createCalBuddyPendingAction = createPending;
  compatibility.executeConfirmed = executeConfirmed;
  window.AriVNextActionAdapter = compatibility;
  window.Ari.vNextActionAdapter = compatibility;

  reconcileOrphanedLegacyPending();
  window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryReady", { detail: { version: VERSION, source: SOURCE, operations: snapshot().operationNames } }));
})();
