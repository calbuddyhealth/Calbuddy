// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-workout-plan-action.js
// Version: 2.0.0
// Purpose:
//   SINGLE originator for Ari-created workout-plan mutations.
//   All Training reads/builds/writes flow through WorkoutPlanController.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "2.0.0";
  const SOURCE = "ari/actions/ari-workout-plan-action";
  const CONFLICT_KEY = "ariWorkoutPlanConflict";
  const EDIT_KEY = "ariWorkoutEditContext";

  const clean = (value = "") => String(value || "").trim();

  function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function parseDateKey(value) {
    const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (
      date.getFullYear() !== Number(match[1]) ||
      date.getMonth() !== Number(match[2]) - 1 ||
      date.getDate() !== Number(match[3])
    ) return null;
    return date;
  }

  function formatDateLabel(value) {
    const date = value instanceof Date ? value : parseDateKey(value);
    if (!date) return "that date";
    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric"
      }).format(date);
    } catch {
      return formatDateKey(date);
    }
  }

  function looksLikeWorkoutPlanRequest(message = "") {
    const text = clean(message).toLowerCase();
    const workoutContext =
      /\b(workout|training plan|training session|exercise plan|exercise session|gym session|lifting session)\b/.test(text) ||
      /\b(hitting|training|working)\s+(?:my\s+)?(chest|back|shoulders?|delts?|legs?|quads?|hamstrings?|glutes?|arms?|biceps?|triceps?|core|abs?)\b/.test(text);
    const creationIntent =
      /\b(make|build|create|plan|schedule|set up|put together|give me|add|replace|edit|change)\b/.test(text) ||
      /\b(can you|could you|would you|please)\b.{0,50}\b(workout|training plan|training session|exercise plan)\b/.test(text);
    const loggingOnly =
      /\b(log|track|record)\b.{0,30}\b(workout|training|exercise)\b/.test(text) ||
      /\b(completed|finished|done with|already did|burned)\b/.test(text);
    return workoutContext && creationIntent && !loggingOnly;
  }

  function resolveRequestedDate(message = "", now = new Date()) {
    const text = clean(message).toLowerCase();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (iso) {
      const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      return parseDateKey(formatDateKey(date)) ? formatDateKey(date) : null;
    }

    const slash = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?\b/);
    if (slash) {
      let year = slash[3] ? Number(slash[3]) : base.getFullYear();
      if (year < 100) year += 2000;
      let date = new Date(year, Number(slash[1]) - 1, Number(slash[2]));
      if (!slash[3] && date < base) date = new Date(year + 1, Number(slash[1]) - 1, Number(slash[2]));
      return formatDateKey(date);
    }

    if (/\btoday\b/.test(text)) return formatDateKey(base);
    if (/\btomorrow\b/.test(text)) {
      const date = new Date(base);
      date.setDate(date.getDate() + 1);
      return formatDateKey(date);
    }

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let target = 0; target < weekdays.length; target += 1) {
      const match = text.match(new RegExp(`\\b(next\\s+|this\\s+)?${weekdays[target]}\\b`));
      if (!match) continue;
      let delta = (target - base.getDay() + 7) % 7;
      if (clean(match[1]).toLowerCase() === "next" && delta === 0) delta = 7;
      const date = new Date(base);
      date.setDate(date.getDate() + delta);
      return formatDateKey(date);
    }

    return null;
  }

  function extractWorkoutRequest(message = "") {
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
      builderOptions: {
        title: focus.title,
        goal: focus.goal,
        durationMinutes,
        difficulty,
        bodyParts: focus.bodyParts,
        modules: focus.modules,
        includeWarmup: durationMinutes >= 15,
        includeCooldown: durationMinutes >= 20,
        includeFinisher: /\b(finisher|conditioning finisher)\b/.test(text),
        focusId: focus.id
      }
    };
  }

  async function getController() {
    const module = await import(new URL("js/training/workout-plan-controller.js", document.baseURI).href);
    const controller = module.default || module.AriTrainingWorkoutPlanController;
    if (!controller?.init || !controller?.getDate || !controller?.buildWorkoutForDate || !controller?.setBuiltWorkoutForDate) {
      throw new Error("Training controller is unavailable.");
    }
    await controller.init();
    return controller;
  }

  function hasWorkout(day) {
    return Boolean(day?.type === "workout" && Array.isArray(day?.exercises) && day.exercises.length > 0);
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

  function conflictChoice(message = "") {
    const text = clean(message).toLowerCase();
    if (/\b(replace|overwrite|start over|swap it)\b/.test(text)) return "replace";
    if (/\b(add|add to it|combine|keep it and add|both)\b/.test(text)) return "add";
    if (/\b(edit|modify|change it|tweak)\b/.test(text)) return "edit";
    return null;
  }

  function buildPendingAction(message, scheduledDate, mode = "create") {
    const workout = extractWorkoutRequest(message);
    const label = formatDateLabel(scheduledDate);
    const verb = mode === "replace" ? "Replace the existing workout with" : mode === "add" ? "Add" : "Create";
    const suffix = mode === "add" ? ` to ${label}'s workout?` : ` for ${label}?`;

    return {
      action_type: "plan_workout",
      status: "pending",
      source: SOURCE,
      payload: {
        scheduled_date: scheduledDate,
        focus_id: workout.focusId,
        builder_options: workout.builderOptions,
        requested_from_message: clean(message),
        existing_workout_mode: mode
      },
      confirmation_text: `${verb} ${workout.displayTitle}${suffix}`
    };
  }

  CalBuddy.planWorkoutFromAri = async function (payload = {}) {
    const scheduledDate = clean(payload.scheduled_date);
    if (!parseDateKey(scheduledDate)) {
      return { success: false, reply: "I need an exact workout date before I can change that plan." };
    }

    const controller = await getController();
    const existingDay = controller.getDate(scheduledDate);
    const existing = hasWorkout(existingDay);
    const mode = clean(payload.existing_workout_mode || "create").toLowerCase();

    if (existing && mode === "create") {
      return {
        success: false,
        conflict: true,
        reply: `${describeWorkout(existingDay)} is already planned for ${formatDateLabel(scheduledDate)}. I didn’t change it.`
      };
    }

    const builderOptions = payload.builder_options && typeof payload.builder_options === "object"
      ? { ...payload.builder_options }
      : {};

    const built = controller.buildWorkoutForDate(scheduledDate, builderOptions);
    if (!built) throw new Error("Training could not build a workout for that date.");

    let workoutToSave = built;
    if (existing && mode === "add") {
      workoutToSave = {
        ...built,
        title: `${describeWorkout(existingDay)} + ${clean(built.title) || "Added Training"}`,
        exercises: [
          ...(Array.isArray(existingDay.exercises) ? existingDay.exercises : []),
          ...(Array.isArray(built.exercises) ? built.exercises : [])
        ]
      };
    }

    const saved = controller.setBuiltWorkoutForDate(scheduledDate, workoutToSave, {
      focusId: mode === "add"
        ? clean(existingDay?.focusId) || clean(payload.focus_id) || "custom"
        : clean(payload.focus_id) || "custom"
    });

    if (!saved) throw new Error("Training could not update the workout on that date.");

    await controller.save({ remote: true });
    clearConflict();

    window.dispatchEvent(new CustomEvent("ari:workoutPlanUpdated", {
      detail: {
        scheduledDate,
        workoutId: workoutToSave.workoutId || null,
        mode,
        source: SOURCE,
        version: VERSION
      }
    }));

    const actionWord = mode === "replace" ? "replaced" : mode === "add" ? "updated" : "set";
    return {
      success: true,
      workout: workoutToSave,
      scheduled_date: scheduledDate,
      reply: `${clean(workoutToSave.title) || "Workout"} is ${actionWord} for ${formatDateLabel(scheduledDate)}.`
    };
  };

  async function inspectDate(scheduledDate) {
    const controller = await getController();
    const day = controller.getDate(scheduledDate);
    return hasWorkout(day)
      ? { day, title: describeWorkout(day), scheduled_date: scheduledDate, dateLabel: formatDateLabel(scheduledDate) }
      : null;
  }

  if (!CalBuddy.__ariWorkoutActionInstalled) {
    const previousExecuteAction = CalBuddy.executeAction;
    const previousAskInternal = CalBuddy._askAriInternal;

    CalBuddy.executeAction = async function (action = {}) {
      const type = action.action_type || action.type;
      if (type === "plan_workout") {
        if (action.source && action.source !== SOURCE) {
          throw new Error("Rejected non-canonical workout action source.");
        }
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
        const storedConflict = readConflict();
        const choice = storedConflict ? conflictChoice(message) : null;

        if (storedConflict && choice) {
          if (choice === "edit") {
            localStorage.setItem(EDIT_KEY, JSON.stringify({
              scheduled_date: storedConflict.scheduled_date,
              existing_title: storedConflict.existing_title,
              saved_at: new Date().toISOString()
            }));
            clearConflict();
            return {
              reply: `I’ll keep ${storedConflict.existing_title} intact. Tell me exactly what you want changed.`,
              pendingAction: null,
              emotion: "coach",
              workoutEditMode: true,
              scheduled_date: storedConflict.scheduled_date
            };
          }

          const pending = buildPendingAction(
            storedConflict.requested_message,
            storedConflict.scheduled_date,
            choice
          );
          clearConflict();
          const action = await CalBuddy.createPendingAction(pending);
          return {
            reply: action.confirmation_text,
            pendingAction: action,
            emotion: "coach",
            workoutPlanProposed: true,
            existingWorkoutMode: choice
          };
        }

        if (looksLikeWorkoutPlanRequest(message)) {
          const requestedDate = resolveRequestedDate(message);
          if (!requestedDate) {
            return {
              reply: "What day do you want me to put that workout on — today, tomorrow, or a specific day?",
              pendingAction: null,
              emotion: "coach",
              workoutDateRequired: true
            };
          }

          const existing = await inspectDate(requestedDate);
          if (existing) {
            saveConflict({
              scheduled_date: requestedDate,
              requested_message: message,
              existing_title: existing.title
            });
            return {
              reply: `You already have ${existing.title} planned for ${existing.dateLabel}. Do you want me to replace it, add the new work to it, or edit the existing workout?`,
              pendingAction: null,
              emotion: "coach",
              workoutPlanConflict: true,
              scheduled_date: requestedDate
            };
          }

          const pending = buildPendingAction(message, requestedDate, "create");
          const action = await CalBuddy.createPendingAction(pending);
          return {
            reply: action.confirmation_text,
            pendingAction: action,
            emotion: "coach",
            workoutPlanProposed: true
          };
        }

        return await previousAskInternal.call(CalBuddy, input);
      };
    }

    CalBuddy.__ariWorkoutActionInstalled = true;
  }

  CalBuddy.resolveAriWorkoutDate = resolveRequestedDate;
  CalBuddy.looksLikeAriWorkoutPlanRequest = looksLikeWorkoutPlanRequest;
  CalBuddy.buildAriWorkoutRequest = extractWorkoutRequest;
  CalBuddy.inspectAriWorkoutDate = inspectDate;

  console.log("ARI WORKOUT PLAN ACTION LOADED:", VERSION);
})();
