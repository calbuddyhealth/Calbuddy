// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-workout-plan-action.js
// Version: 1.2.0
// Purpose:
//   Deterministically recognize, confirm, build, and save Ari-created
//   workouts through the EXISTING ARI Training builder and calendar store.
//
// V1.2.0:
//   - Never silently overwrites an existing workout.
//   - Existing workout conflict offers replace / add / edit.
//   - Replace and add require explicit confirmation before mutation.
//   - Edit mode preserves the current workout and asks for the exact change.
//   - Keeps exact calendar-date routing and existing Training storage.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.2.0";
  const SOURCE = "ari/actions/ari-workout-plan-action";
  const CONFLICT_KEY = "ariWorkoutPlanConflict";
  const EDIT_KEY = "ariWorkoutEditContext";

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
    ) return null;

    return { key: formatLocalDateKey(date), date };
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
      ) return formatLocalDateKey(date);
      return null;
    }

    if (/\btoday\b/.test(text)) return formatLocalDateKey(base);

    if (/\btomorrow\b/.test(text)) {
      const date = new Date(base);
      date.setDate(date.getDate() + 1);
      return formatLocalDateKey(date);
    }

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
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
      { pattern: /\b(biceps?)\b/, id: "biceps", title: "Biceps Workout", goal: "muscle_building", bodyParts: ["arms"], modules: ["biceps"] },
      { pattern: /\b(triceps?)\b/, id: "triceps", title: "Triceps Workout", goal: "muscle_building", bodyParts: ["arms"], modules: ["triceps"] },
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
      goal: "general_fitness",
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

  async function loadCurrentPlan(store, api) {
    store.hydrate?.();
    let remoteLoaded = false;
    try {
      const remotePlan = await api.loadPlan();
      if (remotePlan && typeof store.replaceState === "function") store.replaceState(remotePlan);
      remoteLoaded = true;
    } catch (error) {
      console.warn("ARI workout action could not load remote plan:", error?.message || error);
    }
    return remoteLoaded;
  }

  function getDayFromStore(store, scheduledDate) {
    const weekKey = store.getWeekKey?.(scheduledDate);
    const dayId = store.getDayIdFromDate?.(scheduledDate);
    if (!weekKey || !dayId) return { weekKey, dayId, day: null };

    let day = null;
    if (typeof store.getDate === "function") day = store.getDate(scheduledDate);
    if (!day && typeof store.getDayByDate === "function") day = store.getDayByDate(scheduledDate);
    if (!day && typeof store.getDay === "function") day = store.getDay(dayId, weekKey);
    if (!day && typeof store.getWeek === "function") day = store.getWeek(weekKey)?.days?.[dayId] || null;
    return { weekKey, dayId, day };
  }

  function hasWorkout(day) {
    return Boolean(
      day &&
      day.type === "workout" &&
      Array.isArray(day.exercises) &&
      day.exercises.length > 0
    );
  }

  function describeWorkout(day) {
    return clean(day?.title) || clean(day?.focusLabel) || clean(day?.focusId) || "a workout";
  }

  function saveConflict(value) {
    localStorage.setItem(CONFLICT_KEY, JSON.stringify({ ...value, saved_at: new Date().toISOString() }));
  }

  function readConflict() {
    try {
      const value = JSON.parse(localStorage.getItem(CONFLICT_KEY) || "null");
      if (!value?.scheduled_date || !value?.requested_message) return null;
      if (Date.now() - new Date(value.saved_at || 0).getTime() > 15 * 60 * 1000) {
        localStorage.removeItem(CONFLICT_KEY);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  }

  function clearConflict() {
    localStorage.removeItem(CONFLICT_KEY);
  }

  function resolveConflictChoice(message = "") {
    const text = clean(message).toLowerCase();
    if (/\b(replace|overwrite|swap it|replace it|start over)\b/.test(text)) return "replace";
    if (/\b(add|add to it|keep it and add|combine|both)\b/.test(text)) return "add";
    if (/\b(edit|modify|change the existing|change it|tweak)\b/.test(text)) return "edit";
    return null;
  }

  function buildPendingWorkoutAction(message, scheduledDate, mode = "create") {
    const parsed = parseStrictDateKey(scheduledDate);
    if (!parsed) return null;
    const workout = extractWorkoutRequest(message);
    const dateLabel = formatDateLabel(parsed.date);
    const verb = mode === "replace" ? "Replace the existing workout with" : mode === "add" ? "Add" : "Create";
    const suffix = mode === "add" ? ` to ${dateLabel}'s workout?` : ` for ${dateLabel}?`;

    return {
      action_type: "plan_workout",
      status: "pending",
      payload: {
        scheduled_date: scheduledDate,
        focus_id: workout.focusId,
        builder_request: workout.builderRequest,
        requested_from_message: clean(message),
        existing_workout_mode: mode
      },
      confirmation_text: `${verb} ${workout.displayTitle}${suffix}`
    };
  }

  async function persistPlan(store, api, remoteLoadSucceeded) {
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
    }
    return remoteSaved;
  }

  CalBuddy.planWorkoutFromAri = async function (payload = {}) {
    const scheduled = parseStrictDateKey(payload.scheduled_date);
    if (!scheduled) return { success: false, reply: "I need an exact workout date before I can change that plan." };

    const mode = clean(payload.existing_workout_mode || "create").toLowerCase();
    const builderRequest = payload.builder_request && typeof payload.builder_request === "object"
      ? { ...payload.builder_request }
      : {};
    const { builder, store, api } = await importTrainingModules();
    const remoteLoadSucceeded = await loadCurrentPlan(store, api);
    const current = getDayFromStore(store, scheduled.key);
    const existing = hasWorkout(current.day);

    if (existing && mode === "create") {
      return {
        success: false,
        conflict: true,
        reply: `${describeWorkout(current.day)} is already planned for ${formatDateLabel(scheduled.date)}. I didn’t change it.`
      };
    }

    const workout = builder.build(builderRequest);
    const validation = typeof builder.validate === "function" ? builder.validate(workout) : { valid: true, errors: [] };
    if (!validation.valid) throw new Error(validation.errors?.[0] || "Training could not build a valid workout.");

    let workoutToSave = workout;
    if (existing && mode === "add") {
      const existingExercises = Array.isArray(current.day.exercises) ? current.day.exercises : [];
      const newExercises = Array.isArray(workout.exercises) ? workout.exercises : [];
      workoutToSave = {
        ...workout,
        title: `${describeWorkout(current.day)} + ${clean(workout.title) || "Added Training"}`,
        exercises: [...existingExercises, ...newExercises]
      };
    }

    const savedIntoPlan = store.setBuiltWorkout(current.dayId, workoutToSave, {
      focusId: mode === "add" ? clean(current.day?.focusId) || clean(payload.focus_id) || "custom" : clean(payload.focus_id) || "custom",
      weekKey: current.weekKey
    });
    if (!savedIntoPlan) throw new Error("Training could not update the workout on that date.");

    const planValidation = typeof store.validate === "function" ? store.validate() : { valid: true, errors: [] };
    if (!planValidation.valid) throw new Error(planValidation.errors?.[0] || "The workout plan failed calendar validation.");

    const remoteSaved = await persistPlan(store, api, remoteLoadSucceeded);
    clearConflict();

    window.dispatchEvent(new CustomEvent("ari:workoutPlanUpdated", {
      detail: {
        scheduledDate: scheduled.key,
        weekKey: current.weekKey,
        dayId: current.dayId,
        workoutId: workoutToSave.workoutId,
        mode,
        remoteSaved,
        source: SOURCE,
        version: VERSION
      }
    }));

    const dateLabel = formatDateLabel(scheduled.date);
    const title = clean(workoutToSave.title) || "Workout";
    const actionWord = mode === "replace" ? "replaced" : mode === "add" ? "updated" : "set";
    return {
      success: true,
      workout: workoutToSave,
      scheduled_date: scheduled.key,
      remoteSaved,
      reply: `${title} is ${actionWord} for ${dateLabel}.${remoteSaved ? "" : " It’s saved on this device and will sync when Training can reach your account."}`
    };
  };

  async function inspectExistingWorkout(scheduledDate) {
    const parsed = parseStrictDateKey(scheduledDate);
    if (!parsed) return null;
    try {
      const { store, api } = await importTrainingModules();
      await loadCurrentPlan(store, api);
      const context = getDayFromStore(store, parsed.key);
      return hasWorkout(context.day)
        ? { ...context, title: describeWorkout(context.day), scheduled_date: parsed.key, dateLabel: formatDateLabel(parsed.date) }
        : null;
    } catch (error) {
      console.warn("ARI workout conflict check failed:", error?.message || error);
      return null;
    }
  }

  if (!CalBuddy.__ariWorkoutActionInstalled) {
    const previousExecuteAction = CalBuddy.executeAction;
    const previousAskInternal = CalBuddy._askAriInternal;

    CalBuddy.executeAction = async function (action = {}) {
      const type = action.action_type || action.type;
      if (type === "plan_workout") return await CalBuddy.planWorkoutFromAri(action.payload || {});
      if (typeof previousExecuteAction === "function") return await previousExecuteAction.call(CalBuddy, action);
      return { success: false, reply: "I don’t recognize that action type." };
    };

    if (typeof previousAskInternal === "function") {
      CalBuddy._askAriInternal = async function (input = {}) {
        const message = clean(input.message);
        const conflict = readConflict();
        const conflictChoice = conflict ? resolveConflictChoice(message) : null;

        if (conflict && conflictChoice) {
          if (conflictChoice === "edit") {
            localStorage.setItem(EDIT_KEY, JSON.stringify({
              scheduled_date: conflict.scheduled_date,
              existing_title: conflict.existing_title,
              saved_at: new Date().toISOString()
            }));
            clearConflict();
            CalBuddy.setAriMood?.("coach");
            return {
              reply: `Got it. I’ll keep ${conflict.existing_title} intact. Tell me exactly what you want to change — for example, add lateral raises, remove an exercise, change the duration, or change the focus.`,
              pendingAction: null,
              emotion: "coach",
              workoutEditMode: true,
              scheduled_date: conflict.scheduled_date
            };
          }

          const pending = buildPendingWorkoutAction(
            conflict.requested_message,
            conflict.scheduled_date,
            conflictChoice
          );
          clearConflict();
          if (pending) {
            const action = typeof CalBuddy.createPendingAction === "function"
              ? await CalBuddy.createPendingAction(pending)
              : CalBuddy.setPendingAction?.(pending) || pending;
            CalBuddy.setAriMood?.("coach");
            return {
              reply: action?.confirmation_text || pending.confirmation_text,
              pendingAction: action || pending,
              emotion: "coach",
              workoutPlanProposed: true,
              existingWorkoutMode: conflictChoice
            };
          }
        }

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

          const existing = await inspectExistingWorkout(requestedDate);
          if (existing) {
            saveConflict({
              scheduled_date: requestedDate,
              requested_message: message,
              existing_title: existing.title
            });
            CalBuddy.setAriMood?.("coach");
            return {
              reply: `You already have ${existing.title} planned for ${existing.dateLabel}. Do you want me to replace it, add the new work to it, or edit the existing workout?`,
              pendingAction: null,
              emotion: "coach",
              workoutPlanConflict: true,
              scheduled_date: requestedDate
            };
          }

          const pendingWorkout = buildPendingWorkoutAction(message, requestedDate, "create");
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
  CalBuddy.inspectAriWorkoutDate = inspectExistingWorkout;

  console.log("ARI WORKOUT PLAN ACTION LOADED:", VERSION);
})();