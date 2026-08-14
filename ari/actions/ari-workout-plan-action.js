// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-workout-plan-action.js
// Version: 1.0.0
// Purpose:
//   Execute confirmed Ari-created workouts through the EXISTING
//   ARI Training workout builder, date-specific plan store, and
//   workout-plan Supabase API.
//
// Rules:
//   - Never creates a second workout system.
//   - Never writes a workout without an exact YYYY-MM-DD date.
//   - Re-validates the date at execution time.
//   - Loads the current remote V3 plan before mutation.
//   - Uses WorkoutBuilder.build() -> WorkoutPlanStore.setBuiltWorkout().
//   - Saves the resulting full V3 calendar state through WorkoutPlanApi.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.0";
  const SOURCE = "ari/actions/ari-workout-plan-action";

  function clean(value = "") {
    return String(value || "").trim();
  }

  function parseStrictDateKey(value) {
    const text = clean(value);
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }

    return {
      key: `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      date
    };
  }

  function formatDateLabel(date) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric"
      }).format(date);
    } catch {
      return "that date";
    }
  }

  async function importTrainingModules() {
    const base = document.baseURI;

    const [builderModule, storeModule, apiModule] = await Promise.all([
      import(new URL("js/training/workouts/workout-builder.js", base).href),
      import(new URL("js/training/workout-plan-store.js", base).href),
      import(new URL("js/training/workout-plan-api.js", base).href)
    ]);

    const builder = builderModule.default || builderModule.AriTrainingWorkoutBuilder;
    const store = storeModule.default || storeModule.AriTrainingWorkoutPlanStore;
    const api = apiModule.default || apiModule.AriTrainingWorkoutPlanApi;

    if (!builder?.build) {
      throw new Error("Training workout builder is unavailable.");
    }

    if (!store?.setBuiltWorkout || !store?.getState) {
      throw new Error("Training workout plan store is unavailable.");
    }

    if (!api?.loadPlan || !api?.savePlan) {
      throw new Error("Training workout plan API is unavailable.");
    }

    return { builder, store, api };
  }

  CalBuddy.planWorkoutFromAri = async function (payload = {}) {
    const scheduled = parseStrictDateKey(payload.scheduled_date);

    if (!scheduled) {
      return {
        success: false,
        reply: "I need an exact workout date before I can add that plan."
      };
    }

    const builderRequest =
      payload.builder_request && typeof payload.builder_request === "object"
        ? { ...payload.builder_request }
        : {};

    const { builder, store, api } = await importTrainingModules();

    // Hydrate local fallback first, then let the authenticated remote plan win.
    if (typeof store.hydrate === "function") {
      store.hydrate();
    }

    try {
      const remotePlan = await api.loadPlan();
      if (remotePlan && typeof store.replaceState === "function") {
        store.replaceState(remotePlan);
      }
    } catch (error) {
      // Local/offline fallback remains valid; do not destroy an existing local plan.
      console.warn("ARI workout action could not load remote plan:", error?.message || error);
    }

    const workout = builder.build(builderRequest);
    const validation = typeof builder.validate === "function"
      ? builder.validate(workout)
      : { valid: true, errors: [] };

    if (!validation.valid) {
      throw new Error(
        validation.errors?.[0] || "Training could not build a valid workout."
      );
    }

    const weekKey = store.getWeekKey(scheduled.key);
    const dayId = store.getDayIdFromDate(scheduled.key);

    if (!weekKey || !dayId) {
      throw new Error("Training could not resolve the requested calendar date.");
    }

    const savedIntoPlan = store.setBuiltWorkout(dayId, workout, {
      focusId: clean(payload.focus_id) || "custom",
      weekKey
    });

    if (!savedIntoPlan) {
      throw new Error("Training could not add the workout to that date.");
    }

    const planValidation = typeof store.validate === "function"
      ? store.validate()
      : { valid: true, errors: [] };

    if (!planValidation.valid) {
      throw new Error(
        planValidation.errors?.[0] || "The workout plan failed calendar validation."
      );
    }

    let remoteSaved = false;

    try {
      const savedPlan = await api.savePlan({ plan: store.getState() });
      if (savedPlan && typeof store.replaceState === "function") {
        store.replaceState(savedPlan);
        store.save?.();
      }
      remoteSaved = true;
    } catch (error) {
      // setBuiltWorkout already persisted local V3 state. Preserve it and report success
      // with a sync warning instead of silently discarding the confirmed workout.
      console.warn("ARI workout action saved locally but remote sync failed:", error?.message || error);
    }

    window.dispatchEvent(
      new CustomEvent("ari:workoutPlanUpdated", {
        detail: {
          scheduledDate: scheduled.key,
          weekKey,
          dayId,
          workoutId: workout.workoutId,
          remoteSaved,
          source: SOURCE,
          version: VERSION
        }
      })
    );

    const title = clean(workout.title) || "Workout";
    const dateLabel = formatDateLabel(scheduled.date);

    return {
      success: true,
      workout,
      scheduled_date: scheduled.key,
      week_key: weekKey,
      day: dayId,
      remoteSaved,
      reply: remoteSaved
        ? `${title} is set for ${dateLabel}.`
        : `${title} is set for ${dateLabel}. It’s saved on this device and will need to sync when Training can reach your account.`
    };
  };

  if (!CalBuddy.__ariWorkoutActionInstalled) {
    const previousExecuteAction = CalBuddy.executeAction;

    CalBuddy.executeAction = async function (action = {}) {
      const type = action.action_type || action.type;

      if (type === "plan_workout") {
        return await CalBuddy.planWorkoutFromAri(action.payload || {});
      }

      if (typeof previousExecuteAction === "function") {
        return await previousExecuteAction.call(CalBuddy, action);
      }

      return {
        success: false,
        reply: "I don’t recognize that action type."
      };
    };

    CalBuddy.__ariWorkoutActionInstalled = true;
  }

  console.log("ARI WORKOUT PLAN ACTION LOADED:", VERSION);
})();