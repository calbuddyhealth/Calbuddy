// ARI vNext — remaining Phase 8B compatibility registrations.
// Nutrition and workout mutations are owned by permanent domain services.

(() => {
  "use strict";

  const VERSION = "1.3.0";
  const SOURCE = "ari_vnext_operation_registry_phase8b";
  const INSTALL_FLAG = "__ariOperationRegistryPhase8B";
  const BRIDGE_CLEAR_FLAG = "__ariRegistryFailurePreserveV1";

  const CIRCLE_OPERATIONS = [
    "create_circle_meetup", "join_circle_meetup", "leave_circle_meetup", "cancel_circle_meetup",
    "create_circle_mission", "join_circle_mission", "submit_circle_mission_progress",
    "create_circle_crew", "accept_circle_crew_invite", "decline_circle_crew_invite",
    "leave_circle_crew", "archive_circle_crew"
  ];

  const CIRCLE_ACTION_TYPES = [
    "circle_create_meetup", "circle_join_meetup", "circle_leave_meetup", "circle_cancel_meetup",
    "circle_create_mission", "circle_join_mission", "circle_submit_mission_progress",
    "circle_create_crew", "circle_accept_crew_invite", "circle_decline_crew_invite",
    "circle_leave_crew", "circle_archive_crew"
  ];

  const LIVE_REFERENCE_ACTIONS = new Set([
    "update_weight_log", "delete_weight_log",
    "update_activity_log", "delete_activity_log"
  ]);

  let activityServicePromise = null;
  let protectedPendingId = null;

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const clean = (value = "", max = 500) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const array = (value) => Array.isArray(value) ? value : [];
  const finite = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const failure = (code, message, extra = {}) => ({ success: false, code, message, ...extra });
  const pendingFrom = (input = {}) => input?.vnextPendingAction || input || {};

  async function storePending(pending = {}, action = {}, resolution = {}) {
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return failure("pending_action_service_unavailable", "Ari could not prepare that change safely.");
    }
    const stored = await window.CalBuddy.createPendingAction(action);
    const wrapped = {
      ...stored,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_expires_at: pending.expiresAt || null,
      vnext_source: SOURCE
    };
    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped, resolution };
  }

  function referenceSnapshot() {
    return array(window.AriVNextReferenceState?.snapshot?.()?.references);
  }

  function persistedReference(referenceId = "") {
    const id = clean(referenceId, 180);
    return referenceSnapshot().find((reference) => clean(reference?.referenceId, 180) === id) || null;
  }

  function verifiedPersisted(reference = {}, domain = "", entityType = "") {
    return clean(reference?.state, 40) === "persisted" &&
      (!domain || clean(reference?.domain, 40) === domain) &&
      (!entityType || clean(reference?.entityType, 60) === entityType) &&
      reference?.verification?.verifiedByTrustedExecutor === true;
  }

  function liveTarget(pending = {}) {
    const name = clean(pending?.name, 120);
    if (!LIVE_REFERENCE_ACTIONS.has(name)) return null;
    const referenceId = clean(pending?.arguments?.referenceId, 180);
    const reference = window.AriVNextAuthoritativeReferenceRehydration?.resolveReference?.(referenceId) || null;
    if (!reference) return null;
    const verification = object(reference?.verification);
    if (
      verification.verifiedByTrustedContext !== true ||
      verification.currentContextRead !== true ||
      verification.rehydratedFromAuthoritativeState !== true ||
      verification.staleCheckRequiredBeforeWrite !== true
    ) return null;

    if (["update_weight_log", "delete_weight_log"].includes(name) && clean(reference?.domain, 40) === "goals" && clean(reference?.entityType, 60) === "weight_log" && /^\d{4}-\d{2}-\d{2}$/.test(clean(reference?.canonical?.logDate, 40))) return reference;
    if (["update_activity_log", "delete_activity_log"].includes(name) && clean(reference?.domain, 40) === "training" && clean(reference?.entityType, 60) === "activity_log" && clean(reference?.canonical?.id, 180) && /^\d{4}-\d{2}-\d{2}$/.test(clean(reference?.canonical?.logDate, 40))) return reference;
    return null;
  }

  function summarizeChanges(changes = []) {
    return array(changes).slice(0, 4).map((change) => {
      const field = clean(change?.field, 80).replaceAll("_", " ");
      const value = Number.isFinite(Number(change?.numberValue)) ? Number(change.numberValue) : clean(change?.textValue, 100);
      return field && value !== "" ? `${field} to ${value}` : field;
    }).filter(Boolean).join(", ");
  }

  async function createLivePending(pending = {}, target = {}) {
    const name = clean(pending?.name, 120);
    const label = clean(target?.label, 160) || "that item";
    const args = object(pending?.arguments);

    if (name === "update_weight_log") {
      const value = finite(args?.value);
      const unit = clean(args?.unit, 12).toLowerCase() || "lb";
      if (value === null) return failure("weight_reference_value_required", "Tell Ari the corrected weight.");
      return await storePending(pending, {
        action_type: name,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId, value, unit },
        confirmation_text: `Change ${label} to ${value} ${unit}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    if (name === "delete_weight_log") {
      return await storePending(pending, {
        action_type: name,
        payload: { log_date: target.canonical.logDate, reference_id: target.referenceId },
        confirmation_text: `Delete ${label}?`
      }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
    }

    const deleting = name === "delete_activity_log";
    const changes = deleting ? [] : array(args?.changes).slice(0, 8);
    if (!deleting && !changes.length) return failure("activity_reference_changes_required", "Tell Ari what should change about that activity.");
    return await storePending(pending, {
      action_type: name,
      payload: { activity_id: target.canonical.id, reference_id: target.referenceId, changes },
      confirmation_text: deleting ? `Delete ${label}?` : `Update ${label}${summarizeChanges(changes) ? ` — ${summarizeChanges(changes)}` : ""}?`
    }, { referenceId: target.referenceId, authority: "rehydrated_current_context" });
  }

  function executionEnvelope(pending, target, currentTurnId, result, operation, reply = "") {
    return {
      success: true,
      result,
      ...(reply ? { reply } : {}),
      action: {
        action_type: clean(pending?.name, 120),
        payload: { reference_id: target.referenceId },
        vnext_action_id: pending.id,
        vnext_source_turn_id: pending.sourceTurnId,
        vnext_confirmation_turn_id: clean(currentTurnId, 200) || null,
        vnext_source: SOURCE
      },
      authoritativeReference: {
        referenceId: target.referenceId,
        entityType: target.entityType,
        operation,
        staleCheckedByTrustedExecutor: true,
        target
      }
    };
  }

  async function executeLive(input = {}) {
    const pending = pendingFrom(input);
    const target = liveTarget(pending);
    if (!target) return failure("rehydrated_reference_missing", "That current app item could not be resolved safely.");
    const name = clean(pending?.name, 120);
    const args = object(pending?.arguments);
    const currentTurnId = input?.currentTurnId || null;

    if (["update_weight_log", "delete_weight_log"].includes(name)) {
      const deleting = name === "delete_weight_log";
      const adapter = window.AriVNextWeightAdapter;
      const result = deleting
        ? await adapter?.deleteReferencedWeight?.({ logDate: target.canonical.logDate })
        : await adapter?.updateReferencedWeight?.({ logDate: target.canonical.logDate, value: args?.value, unit: args?.unit });
      if (!result?.success) return result || failure("weight_reference_write_failed", "That weigh-in could not be changed.");
      return executionEnvelope(pending, target, currentTurnId, result, deleting ? "weight_delete" : "weight_update", deleting ? "Weigh-in deleted." : "Weigh-in updated.");
    }

    const deleting = name === "delete_activity_log";
    const adapter = window.AriVNextActivityAdapter;
    const result = deleting
      ? await adapter?.deleteReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate })
      : await adapter?.updateReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate, changes: array(args?.changes).slice(0, 8) });
    if (!result?.success) return result || failure("activity_reference_write_failed", "That activity could not be changed.");
    return executionEnvelope(pending, target, currentTurnId, result, deleting ? "activity_delete" : "activity_update", deleting ? "Activity deleted." : "Activity updated.");
  }

  function persistedActivityTarget(pending = {}) {
    const target = persistedReference(pending?.arguments?.referenceId);
    return verifiedPersisted(target, "training", "activity_log") && clean(target?.canonical?.id, 180) && /^\d{4}-\d{2}-\d{2}$/.test(clean(target?.canonical?.logDate, 40)) ? target : null;
  }

  async function createPersistedActivityPending(pending = {}) {
    const target = persistedActivityTarget(pending);
    if (!target) return failure("activity_reference_target_unavailable", "That activity is no longer available as a verified recent Training entry.");
    const name = clean(pending?.name, 120);
    const deleting = name === "delete_activity_log";
    const changes = deleting ? [] : array(pending?.arguments?.changes).slice(0, 8);
    if (!deleting && !changes.length) return failure("activity_reference_changes_required", "Tell Ari what should change about that activity.");
    return await storePending(pending, {
      action_type: name,
      payload: { activity_id: target.canonical.id, reference_id: target.referenceId, changes },
      confirmation_text: deleting ? `Delete ${clean(target.label, 160) || "that activity"}?` : `Update ${clean(target.label, 160) || "that activity"}${summarizeChanges(changes) ? ` — ${summarizeChanges(changes)}` : ""}?`
    }, { referenceId: target.referenceId, operation: deleting ? "delete" : "update" });
  }

  async function executePersistedActivity(input = {}) {
    const pending = pendingFrom(input);
    const target = persistedActivityTarget(pending);
    if (!target) return failure("activity_reference_target_unavailable", "That activity is no longer available as a verified recent Training entry.");
    const deleting = clean(pending?.name, 120) === "delete_activity_log";
    const adapter = window.AriVNextActivityAdapter;
    const result = deleting
      ? await adapter?.deleteReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate })
      : await adapter?.updateReferencedActivity?.({ activityId: target.canonical.id, logDate: target.canonical.logDate, changes: array(pending?.arguments?.changes).slice(0, 8) });
    if (!result?.success) return result || failure("activity_reference_write_failed", "That activity could not be changed.");
    const execution = {
      success: true,
      result,
      reply: deleting ? "Activity deleted." : "Activity updated.",
      referenceActivity: { referenceId: target.referenceId, activityId: target.canonical.id, operation: deleting ? "delete" : "update", target }
    };
    const lifecycle = window.AriVNextReferenceState?.commit?.({ pendingAction: pending, execution });
    return { ...execution, referenceLifecycle: lifecycle || null };
  }

  async function activityService() {
    if (!activityServicePromise) {
      activityServicePromise = import("../../js/training/activity-log-service.js?v=1.1.0")
        .then((module) => module.default || module.ActivityLogService);
    }
    return await activityServicePromise;
  }

  function installFailurePreservation(registry) {
    const bridge = window.AriVNextBridge;
    if (!bridge?.getPendingAction || !bridge?.setPendingAction || !bridge?.clearPendingAction) return false;
    if (!bridge[BRIDGE_CLEAR_FLAG]) {
      const originalClear = bridge.clearPendingAction.bind(bridge);
      bridge.clearPendingAction = function registryAwarePendingClear() {
        const current = bridge.getPendingAction?.() || null;
        if (protectedPendingId && clean(current?.id, 220) === protectedPendingId) {
          protectedPendingId = null;
          return false;
        }
        return originalClear();
      };
      Object.defineProperty(bridge, BRIDGE_CLEAR_FLAG, { configurable: false, enumerable: false, value: VERSION });
    }

    registry.registerAfterExecution((input = {}, execution = {}) => {
      if (execution?.success !== false) return execution;
      const pending = pendingFrom(input);
      if (!pending?.id) return execution;
      bridge.setPendingAction(pending);
      protectedPendingId = clean(pending.id, 220);
      const protectedId = protectedPendingId;
      window.setTimeout(() => {
        if (protectedPendingId === protectedId) protectedPendingId = null;
      }, 0);
      return execution;
    }, { source: `${SOURCE}:failure-preservation`, priority: 10000 });
    return true;
  }

  function registerCircle(registry) {
    const circle = window.AriVNextCircleActionAdapter;
    if (!circle?.ready || typeof circle.prepare !== "function" || typeof circle.execute !== "function") return false;
    for (const name of CIRCLE_OPERATIONS) {
      registry.registerOperation(name, {
        source: `${SOURCE}:circle`, priority: 2000,
        async prepare(pending = {}) { return await circle.prepare(pending, object(pending?.arguments)); }
      });
    }
    for (const type of CIRCLE_ACTION_TYPES) {
      registry.registerApplicationExecutor(type, {
        source: `${SOURCE}:circle`, priority: 2000,
        async execute(action = {}) { return await circle.execute(action); }
      });
    }
    return true;
  }

  function registerManualActivityExecutor(registry) {
    registry.registerApplicationExecutor("log_activity", {
      source: `${SOURCE}:activity`, priority: 1500,
      async execute(action = {}) {
        const service = await activityService();
        const result = await service.logActivity(action?.payload || {}, { source: clean(action?.payload?.source || "ari_vnext", 80) });
        if (!result?.success) return failure(result?.code || "activity_log_failed", result?.message || "Activity could not be saved.");
        return result;
      }
    });
  }

  function registerReferenceOperations(registry) {
    for (const name of LIVE_REFERENCE_ACTIONS) {
      registry.registerOperation(name, {
        source: `${SOURCE}:authoritative-reference`, priority: 4000,
        match(input = {}) { return Boolean(liveTarget(pendingFrom(input))); },
        async createPending(pending = {}) { return await createLivePending(pending, liveTarget(pending)); },
        async executeConfirmed(input = {}) { return await executeLive(input); }
      });
    }
    for (const name of ["update_activity_log", "delete_activity_log"]) {
      registry.registerOperation(name, {
        source: `${SOURCE}:persisted-reference`, priority: 3000,
        match(input = {}) { return Boolean(persistedActivityTarget(pendingFrom(input))); },
        async createPending(pending = {}) { return await createPersistedActivityPending(pending); },
        async executeConfirmed(input = {}) { return await executePersistedActivity(input); }
      });
    }
  }

  function install() {
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || registry[INSTALL_FLAG]) return Boolean(registry?.[INSTALL_FLAG]);
    if (!window.AriVNextStructuredReferenceCapabilities?.ready || !window.AriVNextAuthoritativeReferenceRehydration?.ready) return false;
    if (!window.AriVNextActivityAdapter || !window.AriVNextWeightAdapter?.ready || !window.AriVNextCircleActionAdapter?.ready) return false;

    installFailurePreservation(registry);
    registerCircle(registry);
    registerManualActivityExecutor(registry);
    registerReferenceOperations(registry);

    Object.defineProperty(registry, INSTALL_FLAG, { configurable: false, enumerable: false, value: VERSION });
    const migratedOperations = Array.from(new Set([...CIRCLE_OPERATIONS, ...LIVE_REFERENCE_ACTIONS, "log_activity"])).sort();
    window.AriVNextOperationRegistryPhase8B = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      migratedOperations,
      migratedApplicationActions: [...CIRCLE_ACTION_TYPES, "log_activity"].sort()
    });
    window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryPhase8BReady", { detail: { version: VERSION, migratedOperations } }));

    import("./ari-vnext-nutrition-plan-command-registry.js?v=1.0.0").catch((error) => {
      console.warn("[Ari Phase 8B] permanent Meal Plan registry failed to load:", error?.message || error);
    });
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    try {
      if (install()) {
        window.clearInterval(timer);
        return;
      }
    } catch (error) {
      console.warn("[Ari Phase 8B] install retry:", error?.message || error);
    }
    if (attempts >= 300) window.clearInterval(timer);
  }, 25);
})();
