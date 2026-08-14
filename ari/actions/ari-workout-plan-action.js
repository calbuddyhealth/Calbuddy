// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-workout-plan-action.js
// Version: 1.0.1
// Purpose:
//   Execute confirmed Ari-created workouts through the EXISTING
//   ARI Training workout builder, date-specific plan store, and
//   workout-plan Supabase API.
//
// Rules:
//   - Never creates a second workout system.
//   - Never writes a workout without an exact YYYY-MM-DD date.
//   - Missing workout dates trigger a clarification instead of an assumption.
//   - Re-validates the date at execution time.
//   - Loads the current remote V3 plan before mutation.
//   - Never overwrites remote plan state after a failed remote load.
//   - Uses WorkoutBuilder.build() -> WorkoutPlanStore.setBuiltWorkout().
//   - Saves the resulting full V3 calendar state through WorkoutPlanApi.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.1";
  const SOURCE = "ari/actions/ari-workout-plan-action";

  function clean(value = "") {
    return String(value || "").trim();
  }

  function formatLocalDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
      key: formatLocalDateKey(date),
      date
    };
  }

  function looksLikeWorkoutPlanRequest(message = "") {
    const text = clean(message).toLowerCase();
    const workoutNoun = /\b(workout|training session|training plan|exercise session|gym session)\b/.test(text);
    const planningVerb = /\b(make|build|create|plan|schedule|set up|put together|give me|add)\b/.test(text);
    const loggingOnly = /\b(log|track|record|completed|finished|burned|calories burned)\b/.test(text);

    return workoutNoun && planningVerb && !loggingOnly;
  }

  function resolveRequestedDate(message = "", now = new Date()) {
    const contractResolver = window.Ari?.actionContract?.resolveWorkoutDate;

    if (typeof contractResolver === "function") {
      return contractResolver.call(window.Ari.actionContract, message, now);
    }

    const text = clean(message).toLowerCase();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const isoMatch = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (isoMatch) {
      const date = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
      if (
        date.getFullYear() === Number(isoMatch[1]) &&
        date.getMonth() === Number(isoMatch[2]) - 1 &&
        date.getDate() === Number(isoMatch[3])
      ) {
        return formatLocalDateKey(date);
      }
      return null;
    }

    if (/\btoday\b/.test(text)) return formatLocalDateKey(base);

    if (/\btomorrow\b/.test(text)) {
      const date = new Date(base);
      date.setDate(date.getDate() + 1);
      return formatLocalDateKey(date);
    }

    const weekdays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday"
    ];

    for (let target = 0; target < weekdays.length; target += 1) {
      const match = text.match(new RegExp(`\\b(next\\s+|this\\s+)?${weekdays[target]}\\b`));
      if (!match) continue;

      let delta = (target - base.getDay() + 7) % 7;
      if (String(match[1] || "").trim() === "next" && delta === 0) delta = 7;

      const date = new Date(base);
      date.setDate(date.getDate() + delta);
      return formatLocalDateKey(date);
    }

    return null;
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

    if (typeof store.hydrate === "function") {
      store.hydrate();
    }

    let remoteLoadSucceeded = false;

    try {
      const remotePlan = await api.loadPlan();
      if (remotePlan && typeof store.replaceState === "function") {
        store.replaceState(remotePlan);
      }
      remoteLoadSucceeded = true;
    } catch (error) {
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

    if (remoteLoadSucceeded) {
      try {
        const savedPlan = await api.savePlan({ plan: store.getState() });
        if (savedPlan && typeof store.replaceState === "function") {
          store.replaceState(savedPlan);
          store.save?.();
        }
        remoteSaved = true;
      } catch (error) {
        console.warn("ARI workout action saved locally but remote sync failed:", error?.message || error);
      }
    } else {
      console.warn("ARI workout action skipped remote save because remote plan loading failed.");
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
    const previousAskInternal = CalBuddy._askAriInternal;

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

    if (typeof previousAskInternal === "function") {
      CalBuddy._askAriInternal = async function (input = {}) {
        const message = clean(input.message);

        if (looksLikeWorkoutPlanRequest(message) && !resolveRequestedDate(message)) {
          CalBuddy.setAriMood?.("coach");
          return {
            reply: "What day do you want me to put that workout on — today, tomorrow, or a specific day?",
            pendingAction: null,
            emotion: "coach",
            workoutDateRequired: true
          };
        }

        return await previousAskInternal.call(CalBuddy, input);
      };
    }

    CalBuddy.__ariWorkoutActionInstalled = true;
  }

  CalBuddy.resolveAriWorkoutDate = resolveRequestedDate;
  CalBuddy.looksLikeAriWorkoutPlanRequest = looksLikeWorkoutPlanRequest;

  console.log("ARI WORKOUT PLAN ACTION LOADED:", VERSION);
})();