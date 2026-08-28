// Permanent ARI Circle operation-registry boundary.
// Circle preparation and guarded RPC execution stay in the Circle adapter while
// Phase-era registry files no longer own Circle routing.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_circle_registry_adapter";
  const OPERATIONS = [
    "create_circle_meetup", "join_circle_meetup", "leave_circle_meetup", "cancel_circle_meetup",
    "create_circle_mission", "join_circle_mission", "submit_circle_mission_progress",
    "create_circle_crew", "accept_circle_crew_invite", "decline_circle_crew_invite",
    "leave_circle_crew", "archive_circle_crew"
  ];
  const ACTION_TYPES = [
    "circle_create_meetup", "circle_join_meetup", "circle_leave_meetup", "circle_cancel_meetup",
    "circle_create_mission", "circle_join_mission", "circle_submit_mission_progress",
    "circle_create_crew", "circle_accept_crew_invite", "circle_decline_crew_invite",
    "circle_leave_crew", "circle_archive_crew"
  ];
  let installed = false;

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function pendingFrom(input = {}) {
    return input?.vnextPendingAction || input || {};
  }

  async function createPending(pending = {}) {
    const circle = window.AriVNextCircleActionAdapter;
    if (!circle?.ready || typeof circle.prepare !== "function") {
      return { success: false, code: "circle_adapter_unavailable", message: "ARI Circle is not ready." };
    }
    const prepared = await circle.prepare(pending, object(pending?.arguments));
    if (!prepared?.success || !prepared?.action) return prepared;
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return { success: false, code: "pending_action_service_unavailable", message: "Ari could not prepare that Circle change safely." };
    }
    const stored = await window.CalBuddy.createPendingAction(prepared.action);
    const wrapped = {
      ...stored,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_expires_at: pending.expiresAt || null,
      vnext_source: SOURCE
    };
    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped };
  }

  async function executeConfirmed(input = {}) {
    const pending = pendingFrom(input);
    const circle = window.AriVNextCircleActionAdapter;
    if (!circle?.ready || typeof circle.prepare !== "function" || typeof circle.execute !== "function") {
      return { success: false, code: "circle_adapter_unavailable", message: "ARI Circle is not ready." };
    }
    const prepared = await circle.prepare(pending, object(pending?.arguments));
    if (!prepared?.success || !prepared?.action) return prepared;
    const action = {
      ...prepared.action,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_confirmation_turn_id: input?.currentTurnId || null,
      vnext_source: SOURCE
    };
    const result = await circle.execute(action);
    if (!result?.success) return result;
    return { success: true, result, action, ...(result.reply ? { reply: result.reply } : {}) };
  }

  function install() {
    if (installed) return true;
    const registry = window.AriVNextOperationRegistry;
    const circle = window.AriVNextCircleActionAdapter;
    if (!registry?.ready || typeof registry.registerOperation !== "function" || !circle?.ready) return false;

    for (const name of OPERATIONS) {
      registry.registerOperation(name, {
        source: SOURCE,
        priority: 23000,
        async prepare(pending = {}) { return await circle.prepare(pending, object(pending?.arguments)); },
        createPending,
        executeConfirmed
      });
    }
    for (const type of ACTION_TYPES) {
      registry.registerApplicationExecutor(type, {
        source: SOURCE,
        priority: 23000,
        async execute(action = {}) { return await circle.execute(action); }
      });
    }

    installed = true;
    window.AriVNextCircleRegistryAdapter = Object.freeze({ version: VERSION, source: SOURCE, ready: true, createPending, executeConfirmed });
    return true;
  }

  if (!install()) {
    window.addEventListener("ari:vnextOperationRegistryReady", install, { once: true });
    window.addEventListener("ari:vnextCircleActionReady", install, { once: true });
  }
})();
