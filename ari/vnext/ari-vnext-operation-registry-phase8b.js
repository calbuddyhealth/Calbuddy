// ARI vNext — remaining Phase 8B compatibility registrations.
// Domain mutations have moved to permanent services. Only Circle compatibility
// and failed-pending preservation remain here temporarily.

(() => {
  "use strict";

  const VERSION = "1.4.0";
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

  let protectedPendingId = null;

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const clean = (value = "", max = 500) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const pendingFrom = (input = {}) => input?.vnextPendingAction || input || {};

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
        source: `${SOURCE}:circle`,
        priority: 2000,
        async prepare(pending = {}) { return await circle.prepare(pending, object(pending?.arguments)); }
      });
    }
    for (const type of CIRCLE_ACTION_TYPES) {
      registry.registerApplicationExecutor(type, {
        source: `${SOURCE}:circle`,
        priority: 2000,
        async execute(action = {}) { return await circle.execute(action); }
      });
    }
    return true;
  }

  function install() {
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || registry[INSTALL_FLAG]) return Boolean(registry?.[INSTALL_FLAG]);
    if (!window.AriVNextCircleActionAdapter?.ready) return false;

    installFailurePreservation(registry);
    registerCircle(registry);

    Object.defineProperty(registry, INSTALL_FLAG, { configurable: false, enumerable: false, value: VERSION });
    const migratedOperations = [...CIRCLE_OPERATIONS].sort();

    window.AriVNextOperationRegistryPhase8B = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      migratedOperations,
      migratedApplicationActions: [...CIRCLE_ACTION_TYPES].sort()
    });
    window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryPhase8BReady", {
      detail: { version: VERSION, migratedOperations }
    }));
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
