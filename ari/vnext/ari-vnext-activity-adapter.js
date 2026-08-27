// ARI vNext — activity logging extension.
// Adds trusted activity logging plus canonical reference edit/delete helpers
// without modifying legacy meal/workout execution.

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const SOURCE = "ari_vnext_activity_adapter";
  let servicePromise = null;

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

  async function mapActivity(pending = {}, args = {}) {
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
      const estimationDrivers = [
        "activity_name",
        "duration_minutes",
        "sets",
        "reps_per_set",
        "intensity",
        "average_heart_rate"
      ];
      const shouldReestimate =
        clean(existing?.calorie_source, 40) === "profile_estimate" &&
        estimationDrivers.some((field) => fields.has(field));
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

    const input = applyReferenceChanges(resolved.activity, changes);
    const result = await resolved.service.updateActivity(activityId, input, {
      source: "ari_vnext_reference_update"
    });
    if (!result?.success) {
      return {
        success: false,
        code: result?.code || "activity_reference_update_failed",
        message: result?.message || "That activity could not be updated."
      };
    }
    return result;
  }

  async function deleteReferencedActivity({ activityId = "", logDate = "" } = {}) {
    const resolved = await findReferencedActivity({ activityId, logDate });
    if (!resolved.success) return resolved;

    const result = await resolved.service.deleteActivity(activityId);
    if (!result?.success) {
      return {
        success: false,
        code: result?.code || "activity_reference_delete_failed",
        message: result?.message || "That activity could not be deleted."
      };
    }
    return result;
  }

  function patchVNextAdapter() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter || adapter.__activityLoggingV1) return Boolean(adapter);

    const originalPrepare = adapter.prepareCalBuddyAction.bind(adapter);
    const originalToCalBuddy = adapter.toCalBuddyAction.bind(adapter);

    adapter.prepareCalBuddyAction = async function patchedPrepare(pendingAction = {}) {
      if (clean(pendingAction?.name, 120) === "log_activity") {
        return await mapActivity(pendingAction, pendingAction?.arguments || {});
      }
      return await originalPrepare(pendingAction);
    };

    adapter.toCalBuddyAction = function patchedSyncMap(pendingAction = {}) {
      if (clean(pendingAction?.name, 120) === "log_activity") {
        return {
          success: false,
          code: "activity_requires_profile_resolution",
          message: "Activity logging is prepared asynchronously from the user's profile."
        };
      }
      return originalToCalBuddy(pendingAction);
    };

    Object.defineProperty(adapter, "__activityLoggingV1", {
      configurable: false,
      enumerable: false,
      value: true
    });

    return true;
  }

  function patchCalBuddyExecutor() {
    window.CalBuddy = window.CalBuddy || {};
    if (window.CalBuddy.__activityExecutorV1) return true;
    if (typeof window.CalBuddy.executeAction !== "function") return false;

    const originalExecute = window.CalBuddy.executeAction.bind(window.CalBuddy);

    window.CalBuddy.executeAction = async function patchedExecute(action = {}) {
      const type = clean(action?.action_type || action?.type, 120);
      if (type !== "log_activity") return await originalExecute(action);

      const service = await loadService();
      const result = await service.logActivity(action?.payload || {}, {
        source: clean(action?.payload?.source || "ari_vnext", 80)
      });

      if (!result?.success) {
        throw new Error(result?.message || "Activity could not be saved.");
      }

      return result;
    };

    Object.defineProperty(window.CalBuddy, "__activityExecutorV1", {
      configurable: false,
      enumerable: false,
      value: true
    });

    return true;
  }

  function install() {
    const adapterReady = patchVNextAdapter();
    const executorReady = patchCalBuddyExecutor();

    if (!adapterReady || !executorReady) {
      window.setTimeout(install, 25);
      return;
    }

    window.AriVNextActivityAdapter = Object.freeze({
      version: VERSION,
      source: SOURCE,
      prepare: mapActivity,
      updateReferencedActivity,
      deleteReferencedActivity
    });

    window.dispatchEvent(new CustomEvent("ari:vnextActivityReady", {
      detail: { version: VERSION }
    }));
  }

  install();
})();