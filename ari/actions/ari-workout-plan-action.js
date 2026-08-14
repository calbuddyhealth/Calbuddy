// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-workout-plan-action.js
// Version: 1.1.0
// Purpose:
//   Deterministically recognize, confirm, build, and save Ari-created
//   workouts through the EXISTING ARI Training builder and calendar store.
//
// V1.1.0:
//   - Handles workout-plan requests even before Rebirth intent scripts finish loading.
//   - Resolves today/tomorrow/weekdays to exact YYYY-MM-DD dates.
//   - Builds a structured focus/body-part request before confirmation.
//   - Requires explicit workout creation language; workout discussion alone never writes.
//   - Confirmation is required before any Training plan mutation.
//   - Uses the existing WorkoutBuilder + WorkoutPlanStore + WorkoutPlanApi only.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.1.0";
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

    return { key: formatLocalDateKey(date), date };
  }

  function looksLikeWorkoutPlanRequest(message = "") {
    const text = clean(message).toLowerCase();

    const workoutContext =
      /\b(workout|training plan|training session|exercise plan|exercise session|gym session|lifting session)\b/.test(text) ||
      /\b(hitting|training|working)\s+(?:my\s+)?(chest|back|shoulders?|delts?|legs?|quads?|hamstrings?|glutes?|arms?|biceps?|triceps?|core|abs?)\b/.test(text);

    const creationIntent =
      /\b(make|build|create|plan|schedule|set up|put together|give me|add)\b/.test(text) ||
      /\b(can you|could you|would you|please)\b.{0,40}\b(workout|training plan|training session|exercise plan)\b/.test(text);

    const completedOrLogging =
      /\b(log|track|record)\b.{0,30}\b(workout|training|exercise)\b/.test(text) ||
      /\b(completed|finished|done with|already did|burned)\b/.test(text);

    return workoutContext && creationIntent && !completedOrLogging;
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

    const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?\b/);
    if (slashMatch) {
      let year = slashMatch[3] ? Number(slashMatch[3]) : base.getFullYear();
      if (year < 100) year += 2000;
      let date = new Date(year, Number(slashMatch[1]) - 1, Number(slashMatch[2]));

      if (
        date.getFullYear() !== year ||
        date.getMonth() !== Number(slashMatch[1]) - 1 ||
        date.getDate() !== Number(slashMatch[2])
      ) {
        return null;
      }

      if (!slashMatch[3] && date < base) {
        date = new Date(year + 1, Number(slashMatch[1]) - 1, Number(slashMatch[2]));
      }

      return formatLocalDateKey(date);
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

  function extractWorkoutRequest(message = "") {
    const contractExtractor = window.Ari?.actionContract?.extractWorkoutRequest;
    if (typeof contractExtractor === "function") {
      return contractExtractor.call(window.Ari.actionContract, message);
    }

    const text = clean(message).toLowerCase();
    const durationMatch = text.match(/\b(\d{1,3})\s*(?:minute|minutes|min|mins)\b/);
    const durationMinutes = durationMatch
      ? Math.max(10, Math.min(180, Number(durationMatch[1])))
      : 45;

    const difficulty = /\b(advanced|hard|intense|heavy)\b/.test(text)
      ? "advanced"
      : /\b(beginner|easy|light)\b/.test(text)
        ? "beginner"
        : "intermediate";

    const focuses = [
      { pattern: /\b(chest|pecs?)\b/, id: "chest", title: "Chest Workout", goal: "muscle_building", bodyParts: ["chest"], modules: ["chest"] },
      { pattern: /\b(back|lats?)\b/, id: "back", title: "Back Workout", goal: "muscle_building", bodyParts: ["back"], modules: ["back"] },
      { pattern: /\b(shoulders?|delts?)\b/, id: "shoulders", title: "Shoulder Workout", goal: "muscle_building", bodyParts: ["shoulders"], modules: ["shoulders"] },
      { pattern: /\b(biceps?|arms?\s*pull)\b/, id: "biceps", title: "Biceps Workout", goal: "muscle_building", bodyParts: ["arms"], modules: ["biceps"] },
      { pattern: /\b(triceps?|arms?\s*push)\b/, id: "triceps", title: "Triceps Workout", goal: "muscle_building", bodyParts: ["arms"], modules: ["triceps"] },
      { pattern: /\b(legs?|lower body|quads?|hamstrings?|glutes?)\b/, id: "legs", title: "Lower Body Workout", goal: "lower_body_strength", bodyParts: ["lower_body"], modules: ["legs", "glutes", "calves"] },
      { pattern: /\b(core|abs?|abdominals?)\b/, id: "core", title: "Core Workout", goal: "core_strength", bodyParts: ["core"], modules: ["core"] },
      { pattern: /\b(cardio|conditioning)\b/, id: "cardio", title: "Cardio Workout", goal: "cardio", bodyParts: [], modules: ["cardio"] },
      { pattern: /\b(run|running)\b/, id: "running", title: "Running Workout", goal: "running", bodyParts: [], modules: ["cardio"] },
      { pattern: /\b(mobility|stretch|flexibility)\b/, id: "mobility", title: "Mobility Workout", goal: "mobility", bodyParts: [], modules: ["functional", "core"] },
      { pattern: /\b(full body|total body)\b/, id: "full_body", title: "Full Body Workout", goal: "general_fitness", bodyParts: [], modules: [] }
    ];

    const focus = focuses.find(item => item.pattern.test(text)) || {
      id: "custom",
      title: "Workout",
      goal: /\b(strength|stronger)\b/.test(text) ? "strength" : "general_fitness",
      bodyParts: [],
      modules: []
    };

    return {
      focusId: focus.id,
      displayTitle: focus.title,
      builderRequest: {
        title: focus.title,
        goal: focus.goal,
        durationMinutes,
        difficulty,
        bodyParts: focus.bodyParts,
        modules: focus.modules,
        includeWarmup: durationMinutes >= 15,
        includeCooldown: durationMinutes >= 20,
        includeFinisher: /\b(finisher|conditioning finisher)\b/.test(text)
      }
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

  function buildPendingWorkoutAction(message = "", scheduledDate = null) {
    const parsed = parseStrictDateKey(scheduledDate);
    if (!parsed) return null;

    const workout = extractWorkoutRequest(message);
    const dateLabel = formatDateLabel(parsed.date);

    return {
      action_type: "plan_workout",
      status: "pending",
      payload: {
        scheduled_date: scheduledDate,
        focus_id: workout.focusId,
        builder_request: workout.builderRequest,
        requested_from_message: clean(message)
      },
      confirmation_text: `Create ${workout.displayTitle} for ${dateLabel}?`
    };
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

    if (!builder?.build) throw new Error("Training workout builder is unavailable.");
    if (!store?.setBuiltWorkout || !store?.getState) throw new Error("Training workout plan store is unavailable.");
    if (!api?.loadPlan || !api?.savePlan) throw new Error("Training workout plan API is unavailable.");

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

    store.hydrate?.();

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
      throw new Error(validation.errors?.[0] || "Training could not build a valid workout.");
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
      throw new Error(planValidation.errors?.[0] || "The workout plan failed calendar validation.");
    }

    store.save?.();

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

    const title = clean(workout.title) || clean(builderRequest.title) || "Workout";
    const dateLabel = formatDateLabel(scheduled.date);
    const exerciseCount = Array.isArray(workout.exercises) ? workout.exercises.length : 0;

    return {
      success: true,
      workout,
      scheduled_date: scheduled.key,
      week_key: weekKey,
      day: dayId,
      remoteSaved,
      reply: remoteSaved
        ? `${title} is set for ${dateLabel}${exerciseCount ? ` with ${exerciseCount} exercises` : ""}.`
        : `${title} is set for ${dateLabel}${exerciseCount ? ` with ${exerciseCount} exercises` : ""}. It’s saved on this device and will sync when Training can reach your account.`
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

      return { success: false, reply: "I don’t recognize that action type." };
    };

    if (typeof previousAskInternal === "function") {
      CalBuddy._askAriInternal = async function (input = {}) {
        const message = clean(input.message);

        if (looksLikeWorkoutPlanRequest(message)) {
          const requestedDate = resolveRequestedDate(message);

          if (!requestedDate) {
            CalBuddy.setAriMood?.("coach");
            return {
              reply: "What day do you want me to put that workout on — today, tomorrow, or a specific day?",
              pendingAction: null,
              emotion: "coach",
              workoutDateRequired: true
            };
          }

          const pendingWorkout = buildPendingWorkoutAction(message, requestedDate);

          if (pendingWorkout) {
            const action = typeof CalBuddy.createPendingAction === "function"
              ? await CalBuddy.createPendingAction(pendingWorkout)
              : CalBuddy.setPendingAction?.(pendingWorkout) || pendingWorkout;

            CalBuddy.setAriMood?.("coach");

            return {
              reply: action?.confirmation_text || pendingWorkout.confirmation_text,
              pendingAction: action || pendingWorkout,
              emotion: "coach",
              workoutPlanProposed: true
            };
          }
        }

        return await previousAskInternal.call(CalBuddy, input);
      };
    }

    CalBuddy.__ariWorkoutActionInstalled = true;
  }

  CalBuddy.resolveAriWorkoutDate = resolveRequestedDate;
  CalBuddy.looksLikeAriWorkoutPlanRequest = looksLikeWorkoutPlanRequest;
  CalBuddy.buildAriWorkoutRequest = extractWorkoutRequest;

  console.log("ARI WORKOUT PLAN ACTION LOADED:", VERSION);
})();