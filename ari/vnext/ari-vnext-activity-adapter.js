// ARI vNext — Activity domain adapter.
//
// Activity preparation, persistence, and reference mutations delegate to the
// canonical ActivityLogService. This module does not monkey-patch global Ari or
// CalBuddy executors. The operation registry is the single execution boundary.

(() => {
  "use strict";

  const VERSION = "2.1.0";
  const SOURCE = "ari_vnext_activity_adapter";
  let servicePromise = null;
  let operationRegistered = false;

  function clean(value = "", max = 180) {
    return String(value ?? "").trim().slice(0, max);
  }

  function loadService() {
    if (!servicePromise) {
      servicePromise = import("../../js/training/activity-log-service.js?v=1.1.0")
        .then((module) => module.default || module.ActivityLogService);
    }
    return servicePromise;
  }

  function successAction(pending, action) {
    return {
      success: true,
      action: {
        ...action,
        source: action.source || SOURCE,
        vnext_action_id: pending?.id || null,
        vnext_source_turn_id: pending?.sourceTurnId || null
      }
    };
  }

  async function prepare(pending = {}, args = {}) {
    const service = await loadService();
    const prepared = await service.prepareActivity({
      activityName: args.activityName,
      durationMinutes: args.durationMinutes,
      sets: args.sets,
      repsPerSet: args.repsPerSet,
      caloriesBurned: args.caloriesBurned,
      intensity: args.intensity,
      averageHeartRate: args.averageHeartRate,
      dateText: args.dateText,
      notes: args.notes
    }, {
      source: "ari_vnext",
      dateText: args.dateText
    });

    if (!prepared?.success || !prepared?.activity) {
      return {
        success: false,
        code: prepared?.code || "activity_prepare_failed",
        message: prepared?.message || "That activity could not be prepared safely."
      };
    }

    const activity = prepared.activity;
    const estimateLabel = activity.calorie_source === "profile_estimate" ? " estimated" : "";
    return successAction(pending, {
      action_type: "log_activity",
      payload: activity,
      confirmation_text:
        `Log ${activity.activity_name}${activity.duration_minutes ? ` for ${Math.round(activity.duration_minutes)} min` : ""} — ${Math.round(activity.calories_burned)}${estimateLabel} kcal?`
    });
  }

  async function execute(action = {}) {
    const service = await loadService();
    const result = await service.logActivity(action?.payload || {}, {
      source: clean(action?.payload?.source || "ari_vnext", 80)
    });
    return result?.success ? result : {
      success: false,
      code: result?.code || "activity_log_failed",
      message: result?.message || "Activity could not be saved."
    };
  }

  async function createPending(pending = {}) {
    if (typeof window.CalBuddy?.createPendingAction !== "function") {
      return { success: false, code: "pending_action_service_unavailable", message: "Ari could not prepare that activity safely." };
    }
    const prepared = await prepare(pending, pending?.arguments || {});
    if (!prepared?.success || !prepared?.action) return prepared;
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
    const pending = input?.vnextPendingAction || input || {};
    const prepared = await prepare(pending, pending?.arguments || {});
    if (!prepared?.success || !prepared?.action) return prepared;
    const action = {
      ...prepared.action,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_confirmation_turn_id: clean(input?.currentTurnId, 200) || null,
      vnext_source: SOURCE
    };
    const result = await execute(action);
    if (!result?.success) return result;
    return {
      success: true,
      result,
      activity: result?.activity || result?.result || null,
      action,
      ...(clean(result?.reply, 2000) ? { reply: clean(result.reply, 2000) } : {})
    };
  }

  function activityInputFromRow(row = {}) {
    return {
      activityName: clean(row?.activity_name, 180),
      durationMinutes: row?.duration_minutes ?? null,
      sets: row?.sets ?? null,
      repsPerSet: row?.reps_per_set ?? null,
      caloriesBurned: row?.calories_burned ?? null,
      intensity: clean(row?.intensity, 40) || "moderate",
      averageHeartRate: row?.average_heart_rate ?? null,
      dateText: clean(row?.log_date, 40) || "today",
      notes: clean(row?.notes, 500),
      calorieSource: clean(row?.calorie_source, 40) || null,
      estimationMethod: clean(row?.estimation_method, 120) || null
    };
  }

  function applyReferenceChanges(existing = {}, changes = []) {
    const input = activityInputFromRow(existing);
    const fields = new Set();

    for (const change of Array.isArray(changes) ? changes : []) {
      const field = clean(change?.field, 80).toLowerCase();
      fields.add(field);
      const numberValue = Number(change?.numberValue);
      const textValue = change?.textValue === null || change?.textValue === undefined
        ? ""
        : clean(change.textValue, field === "notes" ? 500 : 180);

      if (field === "activity_name") input.activityName = textValue;
      else if (field === "duration_minutes") input.durationMinutes = Number.isFinite(numberValue) ? numberValue : null;
      else if (field === "sets") input.sets = Number.isFinite(numberValue) ? numberValue : null;
      else if (field === "reps_per_set") input.repsPerSet = Number.isFinite(numberValue) ? numberValue : null;
      else if (field === "calories_burned") input.caloriesBurned = Number.isFinite(numberValue) ? numberValue : null;
      else if (field === "intensity") input.intensity = textValue;
      else if (field === "average_heart_rate") input.averageHeartRate = Number.isFinite(numberValue) ? numberValue : null;
      else if (field === "log_date") input.dateText = textValue;
      else if (field === "notes") input.notes = textValue;
    }

    if (fields.has("calories_burned")) {
      input.calorieSource = null;
      input.estimationMethod = null;
    } else {
      const drivers = ["activity_name", "duration_minutes", "sets", "reps_per_set", "intensity", "average_heart_rate"];
      const shouldReestimate =
        clean(existing?.calorie_source, 40) === "profile_estimate" &&
        drivers.some((field) => fields.has(field));
      if (shouldReestimate) {
        input.caloriesBurned = null;
        input.calorieSource = null;
        input.estimationMethod = null;
      }
    }
    return input;
  }

  async function findReferencedActivity({ activityId = "", logDate = "" } = {}) {
    const id = clean(activityId, 160);
    const date = clean(logDate, 40);
    if (!id || !date) {
      return { success: false, code: "activity_reference_identity_required", message: "That activity could not be identified safely." };
    }
    const service = await loadService();
    const rows = await service.listActivities(date);
    const activity = (Array.isArray(rows) ? rows : []).find((row) => clean(row?.id, 160) === id) || null;
    if (!activity) {
      return { success: false, code: "activity_reference_not_found", message: "That recent activity is no longer available." };
    }
    return { success: true, activity, service };
  }

  async function updateReferencedActivity({ activityId = "", logDate = "", changes = [] } = {}) {
    const resolved = await findReferencedActivity({ activityId, logDate });
    if (!resolved.success) return resolved;
    const service = resolved.service;
    const result = await service.updateActivity(activityId, applyReferenceChanges(resolved.activity, changes), {
      source: "ari_vnext_reference_update"
    });
    return result?.success ? result : {
      success: false,
      code: result?.code || "activity_reference_update_failed",
      message: result?.message || "That activity could not be updated."
    };
  }

  async function deleteReferencedActivity({ activityId = "", logDate = "" } = {}) {
    const resolved = await findReferencedActivity({ activityId, logDate });
    if (!resolved.success) return resolved;
    const service = resolved.service;
    const result = await service.deleteActivity(activityId);
    return result?.success ? result : {
      success: false,
      code: result?.code || "activity_reference_delete_failed",
      message: result?.message || "That activity could not be deleted."
    };
  }

  function registerOperation() {
    if (operationRegistered) return true;
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || typeof registry.registerOperation !== "function") return false;
    registry.registerOperation("log_activity", {
      source: SOURCE,
      priority: 12000,
      prepare: async (pending = {}) => await prepare(pending, pending?.arguments || {}),
      createPending,
      executeConfirmed
    });
    operationRegistered = true;
    return true;
  }

  window.AriVNextActivityAdapter = Object.freeze({
    version: VERSION,
    source: SOURCE,
    prepare,
    execute,
    createPending,
    executeConfirmed,
    updateReferencedActivity,
    deleteReferencedActivity
  });

  if (!registerOperation()) {
    window.addEventListener("ari:vnextOperationRegistryReady", registerOperation, { once: true });
  }

  window.dispatchEvent(new CustomEvent("ari:vnextActivityReady", {
    detail: { version: VERSION, source: SOURCE }
  }));
})();
