// ARI vNext — activity logging extension.
// Adds one trusted log_activity action without modifying legacy meal/workout execution.

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const SOURCE = "ari_vnext_activity_adapter";
  let servicePromise = null;

  function clean(value = "", max = 180) {
    return String(value ?? "").trim().slice(0, max);
  }

  function mentionsExplicitOtherDate(message = "") {
    const text = clean(message, 1200).toLowerCase();
    if (!text) return false;
    if (/\b(yesterday|tomorrow|day before yesterday|last night)\b/.test(text)) return true;
    if (/\b\d{4}-\d{2}-\d{2}\b/.test(text)) return true;
    if (/\b(?:sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\b/.test(text)) return true;
    if (/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/.test(text)) return true;
    if (/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/.test(text)) return true;
    return false;
  }

  function resolveActivityDateText(pending = {}, args = {}) {
    const sourceMessage = clean(pending?.sourceMessage, 1200);
    return mentionsExplicitOtherDate(sourceMessage)
      ? clean(args?.dateText, 80)
      : "today";
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
      dateText: resolveActivityDateText(pending, args),
      notes: args.notes
    }, {
      source: "ari_vnext",
      dateText: resolveActivityDateText(pending, args)
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
      prepare: mapActivity
    });

    window.dispatchEvent(new CustomEvent("ari:vnextActivityReady", {
      detail: { version: VERSION }
    }));
  }

  install();
})();