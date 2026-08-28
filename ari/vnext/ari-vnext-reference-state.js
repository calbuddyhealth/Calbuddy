// ARI vNext — bounded browser-side reference lifecycle state.
// Pointer continuity only. Mutation authority remains in OperationRegistry/domain services.

(() => {
  "use strict";

  const VERSION = "1.3.0";
  const STORAGE_PREFIX = "ari_vnext_reference_state_v1";
  const MAX_REFERENCES = 8;
  const MAX_AGE_MS = 6 * 60 * 60 * 1000;
  const REGISTRY_HOOK_SOURCE = "ari_vnext_reference_lifecycle";
  const BRIDGE_FLAG = "__ariReferenceContextV2";
  const CANCEL_FLAG = "__ariReferenceCancelV2";

  function clean(value = "", max = 180) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function hash(value = "") {
    const source = String(value || "default");
    let result = 2166136261;
    for (let index = 0; index < source.length; index += 1) {
      result ^= source.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  }

  function currentConversationId(explicit = null) {
    return clean(explicit || window.CalBuddy?.getConversationId?.() || "default", 200) || "default";
  }

  function storageKey(conversationId = null) {
    return `${STORAGE_PREFIX}:${hash(currentConversationId(conversationId))}`;
  }

  function compactObject(value, maxKeys = 12) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const output = {};
    for (const [key, raw] of Object.entries(value).slice(0, maxKeys)) {
      if (raw === null || raw === undefined || raw === "") continue;
      if (typeof raw === "number" && Number.isFinite(raw)) output[key] = raw;
      else if (typeof raw === "boolean") output[key] = raw;
      else if (typeof raw === "string") output[key] = clean(raw, 220);
    }
    return output;
  }

  function compactReference(reference = {}) {
    return {
      referenceId: clean(reference.referenceId, 160),
      actionName: clean(reference.actionName, 120),
      domain: clean(reference.domain, 40) || "general",
      entityType: clean(reference.entityType, 60) || "app_object",
      label: clean(reference.label, 220) || "Recent Ari action",
      state: clean(reference.state, 40) || "discussed",
      sourceTurnId: clean(reference.sourceTurnId, 200) || null,
      vnextActionId: clean(reference.vnextActionId, 200) || null,
      canonical: compactObject(reference.canonical),
      details: compactObject(reference.details),
      verification: compactObject(reference.verification, 10),
      updatedAt: clean(reference.updatedAt, 80) || new Date().toISOString(),
      expiresAt: clean(reference.expiresAt, 80) || null
    };
  }

  function prune(references = []) {
    const now = Date.now();
    return (Array.isArray(references) ? references : [])
      .filter((reference) => {
        if (!reference || typeof reference !== "object") return false;
        if (["cancelled", "failed", "expired", "deleted"].includes(clean(reference.state, 40))) return false;
        const updatedAt = Date.parse(clean(reference.updatedAt, 80));
        return !Number.isFinite(updatedAt) || now - updatedAt <= MAX_AGE_MS;
      })
      .sort((left, right) => Date.parse(right?.updatedAt || 0) - Date.parse(left?.updatedAt || 0))
      .slice(0, MAX_REFERENCES)
      .map(compactReference);
  }

  function read(conversationId = null) {
    try {
      const raw = sessionStorage.getItem(storageKey(conversationId));
      if (!raw) return { version: VERSION, references: [] };
      const parsed = JSON.parse(raw);
      return { version: VERSION, references: prune(parsed?.references) };
    } catch {
      return { version: VERSION, references: [] };
    }
  }

  function write(state = {}, conversationId = null) {
    const next = { version: VERSION, references: prune(state?.references) };
    try { sessionStorage.setItem(storageKey(conversationId), JSON.stringify(next)); } catch {}
    return next;
  }

  function domainForAction(name = "") {
    const action = clean(name, 120).toLowerCase();
    if (/meal|nutrition|food/.test(action)) return "nutrition";
    if (/workout|training|activity|exercise/.test(action)) return "training";
    if (/weight|goal|profile/.test(action)) return "goals";
    if (/meetup|mission|crew|circle|quest|friend|challenge|event/.test(action)) return "social";
    if (/experiment/.test(action)) return "training";
    return "general";
  }

  function entityTypeForAction(name = "") {
    const action = clean(name, 120).toLowerCase();
    if (action === "log_meal") return "meal";
    if (/meal_plan|planned_meal|plan_meal/.test(action)) return "meal_plan_item";
    if (/activity/.test(action)) return "activity_log";
    if (/weight/.test(action)) return "weight_log";
    if (action === "update_goal") return "goal";
    if (/workout/.test(action)) return "workout";
    if (/meetup/.test(action)) return "meetup";
    if (/mission|quest/.test(action)) return "mission";
    if (/crew/.test(action)) return "crew";
    if (/experiment/.test(action)) return "experiment";
    return "app_object";
  }

  function detailsForAction(pending = {}) {
    const args = pending?.arguments && typeof pending.arguments === "object" ? pending.arguments : {};
    const allowed = ["calories","proteinG","carbsG","fatG","quantity","unit","servingSize","mealCategory","dateText","activityName","durationMinutes","sets","repsPerSet","caloriesBurned","intensity","averageHeartRate","notes","goalType","value","focus","operation","exercise","replacementExercise","slot","mealSlot","title"];
    const details = {};
    for (const key of allowed) {
      const value = args[key];
      if (value === null || value === undefined || value === "") continue;
      if (typeof value === "number" && Number.isFinite(value)) details[key] = value;
      else if (typeof value === "string") details[key] = clean(value, key === "notes" ? 220 : 180);
    }
    return details;
  }

  function labelForAction(pending = {}) {
    const name = clean(pending?.name, 120);
    const args = pending?.arguments && typeof pending.arguments === "object" ? pending.arguments : {};
    if (name === "log_meal") return clean(args.name, 220) || "Meal";
    if (/activity/.test(name)) return clean(args.activityName, 220) || "Activity";
    if (/weight/.test(name)) return `${clean(args.value, 40)} ${clean(args.unit, 20) || "lb"}`.trim();
    if (/workout/.test(name)) return clean(args.title || args.focus, 220) || `${clean(args.dateText, 80) || "Planned"} workout`;
    return clean(args.title || args.name || args.label, 220) || name.replaceAll("_", " ") || "Recent Ari action";
  }

  function makeReferenceId(pending = {}) {
    const actionId = clean(pending?.id, 200);
    return actionId ? `ref_action_${hash(actionId)}` : `ref_action_${Date.now().toString(36)}`;
  }

  function pendingReference(pending = {}) {
    return compactReference({
      referenceId: makeReferenceId(pending), actionName: pending?.name,
      domain: domainForAction(pending?.name), entityType: entityTypeForAction(pending?.name),
      label: labelForAction(pending), state: "pending_confirmation",
      sourceTurnId: pending?.sourceTurnId, vnextActionId: pending?.id,
      canonical: {}, details: detailsForAction(pending),
      verification: { verifiedByTrustedExecutor: false },
      updatedAt: new Date().toISOString(), expiresAt: pending?.expiresAt || null
    });
  }

  function upsert(reference, conversationId = null) {
    const state = read(conversationId);
    const references = state.references.filter((item) => item.referenceId !== reference.referenceId);
    references.unshift(reference);
    return write({ references }, conversationId).references[0] || reference;
  }

  function resolveReference(referenceId = "", conversationId = null) {
    const id = clean(referenceId, 160);
    return id ? read(conversationId).references.find((reference) => reference.referenceId === id) || null : null;
  }

  function rememberPending({ pendingAction, conversationId = null } = {}) {
    if (!pendingAction?.id || !pendingAction?.name) return null;
    if (/^(undo_nutrition_mutation|update_activity_log|delete_activity_log|update_weight_log|delete_weight_log|edit_referenced_workout|delete_workout|update_nutrition_meal|log_referenced_|discard_referenced_|replace_referenced_)/.test(clean(pendingAction.name, 120))) return null;
    return upsert(pendingReference(pendingAction), conversationId);
  }

  function findValue(root, keys = [], depth = 0) {
    if (!root || typeof root !== "object" || depth > 4) return null;
    for (const key of keys) if (root[key] !== null && root[key] !== undefined && root[key] !== "") return root[key];
    for (const value of Object.values(root)) {
      if (!value || typeof value !== "object") continue;
      const found = findValue(value, keys, depth + 1);
      if (found !== null && found !== undefined && found !== "") return found;
    }
    return null;
  }

  function canonicalForExecution(pending = {}, execution = {}) {
    const action = clean(pending?.name, 120);
    const result = execution?.result && typeof execution.result === "object" ? execution.result : execution || {};
    const canonical = {};
    if (action === "log_meal") {
      canonical.id = clean(findValue(result, ["id", "meal_id"]), 160) || undefined;
      canonical.mutationId = clean(findValue(result, ["ari_mutation_id", "mutationId"]), 160) || undefined;
      canonical.nutritionDate = clean(findValue(result, ["nutrition_date", "nutritionDate"]), 40) || undefined;
    } else if (action === "log_activity") {
      canonical.id = clean(findValue(result, ["id", "activity_id", "activityId"]), 160) || undefined;
      canonical.logDate = clean(findValue(result, ["log_date", "logDate"]), 40) || undefined;
    } else if (action === "log_weight") {
      canonical.id = clean(findValue(result, ["id", "weight_id", "weightId"]), 160) || undefined;
      canonical.logDate = clean(findValue(result, ["log_date", "logDate"]), 40) || clean(pending?.arguments?.dateText, 40) || undefined;
    } else if (/workout/.test(action)) {
      canonical.id = clean(findValue(result, ["workoutId", "workout_id"]), 160) || undefined;
      canonical.date = clean(findValue(result, ["scheduled_date", "scheduledDate", "date"]), 40) || clean(pending?.arguments?.dateText, 40) || undefined;
    } else {
      canonical.id = clean(findValue(result, ["meetupId", "missionId", "crewId", "planItemId", "experimentId", "id"]), 160) || undefined;
      canonical.date = clean(findValue(result, ["scheduled_date", "log_date", "nutrition_date", "date"]), 40) || undefined;
    }
    return compactObject(canonical, 8);
  }

  function tombstone(target = {}, conversationId = null) {
    if (!target?.referenceId) return null;
    const state = read(conversationId);
    write({ references: state.references.filter((item) => item.referenceId !== target.referenceId) }, conversationId);
    return compactReference({ ...target, state: "deleted", verification: { ...target.verification, verifiedByTrustedExecutor: true, executorSuccess: true }, updatedAt: new Date().toISOString(), expiresAt: null });
  }

  function commit({ pendingAction, execution, conversationId = null } = {}) {
    if (!pendingAction?.id || execution?.success === false) return null;
    const authoritative = execution?.authoritativeReference;
    const target = authoritative?.target || resolveReference(pendingAction?.arguments?.referenceId, conversationId);
    const operation = clean(authoritative?.operation, 80);
    if (target?.referenceId && /undo|delete/.test(operation)) return tombstone(target, conversationId);
    if (target?.referenceId && /update|edit/.test(operation)) {
      return upsert(compactReference({ ...target, state: "persisted", verification: { ...target.verification, verifiedByTrustedExecutor: true, executorSuccess: true }, updatedAt: new Date().toISOString(), expiresAt: null }), conversationId);
    }

    const existing = resolveReference(makeReferenceId(pendingAction), conversationId) || pendingReference(pendingAction);
    return upsert(compactReference({
      ...existing, state: "persisted", canonical: canonicalForExecution(pendingAction, execution),
      details: { ...existing.details, ...detailsForAction(pendingAction) },
      verification: { verifiedByTrustedExecutor: true, executorSuccess: true },
      updatedAt: new Date().toISOString(), expiresAt: null
    }), conversationId);
  }

  function removeAction(pendingAction = {}, conversationId = null) {
    const id = makeReferenceId(pendingAction);
    const state = read(conversationId);
    write({ references: state.references.filter((item) => item.referenceId !== id) }, conversationId);
    return true;
  }

  function cancel({ pendingAction, conversationId = null } = {}) { return pendingAction?.id ? removeAction(pendingAction, conversationId) : false; }
  function fail({ pendingAction, conversationId = null } = {}) { return pendingAction?.id ? removeAction(pendingAction, conversationId) : false; }

  function snapshot({ conversationId = null } = {}) {
    const state = read(conversationId);
    return state.references.length ? { version: VERSION, references: state.references.map(compactReference) } : null;
  }

  function clear({ conversationId = null } = {}) {
    try { sessionStorage.removeItem(storageKey(conversationId)); } catch {}
    return true;
  }

  function installRegistryHook() {
    const registry = window.AriVNextOperationRegistry;
    if (registry?.ready !== true || typeof registry?.registerAfterExecution !== "function") return false;
    const hooks = registry.snapshot?.().afterExecutionHooks || [];
    if (hooks.includes(REGISTRY_HOOK_SOURCE)) return true;
    registry.registerAfterExecution(async (input = {}, execution = {}) => {
      const pendingAction = input?.vnextPendingAction || input || {};
      if (execution?.success !== true) {
        fail({ pendingAction });
        return execution;
      }
      const referenceLifecycle = commit({ pendingAction, execution });
      return referenceLifecycle ? { ...execution, referenceLifecycle } : execution;
    }, { source: REGISTRY_HOOK_SOURCE, priority: -1000 });
    return true;
  }

  function patchBridge() {
    const bridge = window.AriVNextBridge;
    if (!bridge || bridge[BRIDGE_FLAG]) return Boolean(bridge?.[BRIDGE_FLAG]);
    if (typeof bridge.buildContext !== "function") return false;
    const originalBuildContext = bridge.buildContext.bind(bridge);
    bridge.buildContext = async function referenceAwareContext(options = {}) {
      const context = await originalBuildContext(options);
      const referenceState = snapshot({ conversationId: options?.conversationId || null });
      return referenceState ? { ...context, referenceState } : context;
    };
    Object.defineProperty(bridge, BRIDGE_FLAG, { value: true });
    return true;
  }

  function patchCancelBoundary() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy || CalBuddy[CANCEL_FLAG]) return Boolean(CalBuddy?.[CANCEL_FLAG]);
    if (typeof CalBuddy.cancelPendingAction !== "function") return false;
    const originalCancel = CalBuddy.cancelPendingAction.bind(CalBuddy);
    CalBuddy.cancelPendingAction = function referenceAwareCancel(...args) {
      const pending = window.AriVNextBridge?.getPendingAction?.() || null;
      const result = originalCancel(...args);
      cancel({ pendingAction: pending });
      return result;
    };
    Object.defineProperty(CalBuddy, CANCEL_FLAG, { value: true });
    return true;
  }

  function install() {
    return installRegistryHook() && patchBridge() && patchCancelBoundary();
  }

  window.AriVNextReferenceState = Object.freeze({
    version: VERSION,
    source: "ari-vnext-reference-state",
    ready: true,
    rememberPending,
    resolveReference,
    commit,
    cancel,
    fail,
    snapshot,
    clear
  });

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 40);
  }

  window.dispatchEvent(new CustomEvent("ari:vnextReferenceStateReady", { detail: { version: VERSION } }));
})();