// ARI vNext — Phase 9B correction-chain continuity guard.
//
// This layer closes two narrow conversational trust gaps without creating a new
// execution authority:
// 1) correction language supersedes an older pending confirmation before the
//    corrected turn is sent to Ari; and
// 2) a successful reference delete leaves a short-lived, non-writable
//    invalidation pointer so a bare pronoun on the next turn cannot silently
//    retarget a different surviving object.
//
// The canonical operation registry still owns execution. The current user turn
// still owns mutation authorization. No canonical database ID is stored here.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_phase9b_correction_continuity";
  const STORAGE_PREFIX = "ari_vnext_phase9b_invalidations_v1";
  const INVALIDATION_TTL_MS = 3 * 60 * 1000;
  const MAX_INVALIDATIONS = 3;
  const BRIDGE_FLAG = "__ariPhase9BCorrectionContinuityV1";

  const INVALIDATING_OPERATIONS = new Map([
    ["undo_nutrition_mutation", { domain: "nutrition", entityType: "meal" }],
    ["discard_referenced_meal_plan", { domain: "nutrition", entityType: "meal_plan_item" }],
    ["delete_activity_log", { domain: "training", entityType: "activity_log" }],
    ["delete_weight_log", { domain: "goals", entityType: "weight_log" }],
    ["delete_workout", { domain: "training", entityType: "workout" }]
  ]);

  const CORRECTION_PREFIX = /^(?:actually\b|no[,;:]?\s+(?:i\s+)?meant\b|i\s+meant\b|wait[,;:]?\b|sorry[,;:]?\b|correction\b|rather\b)/i;

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const api = {
    version: VERSION,
    source: SOURCE,
    ready: false,
    snapshot() {
      return {
        version: VERSION,
        ready: api.ready,
        invalidations: readInvalidations()
      };
    }
  };
  window.AriVNextPhase9BCorrectionContinuity = api;

  let registryHookInstalled = false;

  function clean(value = "", max = 220) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function hash(value = "") {
    const text = String(value || "default");
    let result = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      result ^= text.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  }

  function conversationId(explicit = null) {
    return clean(explicit || window.CalBuddy?.getConversationId?.() || "default", 200) || "default";
  }

  function storageKey(explicitConversationId = null) {
    return `${STORAGE_PREFIX}:${hash(conversationId(explicitConversationId))}`;
  }

  function pruneInvalidations(value = []) {
    const now = Date.now();
    return (Array.isArray(value) ? value : [])
      .filter((item) => item && typeof item === "object")
      .filter((item) => {
        const expiresAt = Date.parse(clean(item?.expiresAt, 80));
        return Number.isFinite(expiresAt) && expiresAt > now;
      })
      .sort((left, right) => Date.parse(right?.invalidatedAt || 0) - Date.parse(left?.invalidatedAt || 0))
      .slice(0, MAX_INVALIDATIONS)
      .map((item) => ({
        referenceId: clean(item?.referenceId, 180),
        operation: clean(item?.operation, 120),
        domain: clean(item?.domain, 40),
        entityType: clean(item?.entityType, 60),
        state: "invalidated",
        invalidatedAt: clean(item?.invalidatedAt, 80),
        expiresAt: clean(item?.expiresAt, 80)
      }))
      .filter((item) => item.referenceId && item.operation && item.domain);
  }

  function readInvalidations(explicitConversationId = null) {
    try {
      const raw = sessionStorage.getItem(storageKey(explicitConversationId));
      if (!raw) return [];
      return pruneInvalidations(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  function writeInvalidations(items = [], explicitConversationId = null) {
    const next = pruneInvalidations(items);
    try {
      if (next.length) sessionStorage.setItem(storageKey(explicitConversationId), JSON.stringify(next));
      else sessionStorage.removeItem(storageKey(explicitConversationId));
    } catch {
      // Browser storage restrictions must never block Ari or app mutations.
    }
    return next;
  }

  function clearInvalidations(explicitConversationId = null) {
    return writeInvalidations([], explicitConversationId);
  }

  function rememberInvalidation(pendingAction = {}, explicitConversationId = null) {
    const operation = clean(pendingAction?.name, 120);
    const descriptor = INVALIDATING_OPERATIONS.get(operation);
    const referenceId = clean(pendingAction?.arguments?.referenceId, 180);
    if (!descriptor || !referenceId) return null;

    const invalidatedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + INVALIDATION_TTL_MS).toISOString();
    const current = readInvalidations(explicitConversationId)
      .filter((item) => item.referenceId !== referenceId);
    const next = writeInvalidations([{
      referenceId,
      operation,
      domain: descriptor.domain,
      entityType: descriptor.entityType,
      state: "invalidated",
      invalidatedAt,
      expiresAt
    }, ...current], explicitConversationId);
    return next[0] || null;
  }

  function isCorrectionSupersession(message = "") {
    return CORRECTION_PREFIX.test(clean(message, 500));
  }

  function supersedePending(pendingAction = null) {
    const pendingId = clean(pendingAction?.id, 220);
    if (!pendingId) return false;

    const bridge = window.AriVNextBridge;
    const bridgePending = bridge?.getPendingAction?.() || null;
    if (clean(bridgePending?.id, 220) === pendingId) bridge?.clearPendingAction?.();

    const legacyPending = window.CalBuddy?.getPendingAction?.() || null;
    if (clean(legacyPending?.vnext_action_id, 220) === pendingId) {
      if (typeof window.CalBuddy?.clearPendingAction === "function") window.CalBuddy.clearPendingAction();
      else window.CalBuddy?.cancelPendingAction?.();
    }

    try {
      window.AriVNextReferenceState?.cancel?.({ pendingAction });
    } catch {}

    try {
      window.AriVNextOperationRegistry?.reconcileOrphanedLegacyPending?.();
    } catch {}

    try {
      window.dispatchEvent(new CustomEvent("ari:vnextPendingSuperseded", {
        detail: { version: VERSION, pendingActionId: pendingId }
      }));
    } catch {}
    return true;
  }

  function patchBridge() {
    const bridge = window.AriVNextBridge;
    if (!bridge) return false;
    if (bridge[BRIDGE_FLAG]) return true;
    if (typeof bridge.ask !== "function" || typeof bridge.buildContext !== "function") return false;

    const originalAsk = bridge.ask.bind(bridge);
    const originalBuildContext = bridge.buildContext.bind(bridge);

    bridge.ask = async function phase9BCorrectionAwareAsk(message, options = {}) {
      const pendingBefore = bridge.getPendingAction?.() || null;
      if (pendingBefore && isCorrectionSupersession(message)) {
        supersedePending(pendingBefore);
      }
      return await originalAsk(message, options);
    };

    bridge.buildContext = async function phase9BInvalidationAwareContext(options = {}) {
      const context = await originalBuildContext(options);
      const recentInvalidations = readInvalidations(options?.conversationId || null);
      if (!recentInvalidations.length) return context;
      const referenceState = context?.referenceState && typeof context.referenceState === "object"
        ? context.referenceState
        : {};
      return {
        ...context,
        referenceState: {
          ...referenceState,
          recentInvalidations
        }
      };
    };

    Object.defineProperty(bridge, BRIDGE_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });
    return true;
  }

  function installRegistryHook() {
    if (registryHookInstalled) return true;
    const registry = window.AriVNextOperationRegistry;
    if (registry?.ready !== true || typeof registry?.registerAfterExecution !== "function") return false;

    registry.registerAfterExecution((input = {}, execution = {}) => {
      if (execution?.success !== true) return execution;
      const pendingAction = input?.vnextPendingAction || null;
      const operation = clean(pendingAction?.name, 120);
      if (!operation) return execution;

      if (INVALIDATING_OPERATIONS.has(operation)) {
        rememberInvalidation(pendingAction);
      } else {
        // Any later successful mutation establishes a newer trusted action
        // anchor, so an older delete should no longer shadow bare pronouns.
        clearInvalidations();
      }
      return execution;
    }, { source: SOURCE, priority: -1000 });

    registryHookInstalled = true;
    return true;
  }

  function install() {
    const bridgeReady = patchBridge();
    const registryReady = installRegistryHook();
    if (!bridgeReady || !registryReady) return false;

    api.ready = true;
    try {
      window.dispatchEvent(new CustomEvent("ari:vnextPhase9BCorrectionContinuityReady", {
        detail: { version: VERSION, source: SOURCE }
      }));
    } catch {}
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