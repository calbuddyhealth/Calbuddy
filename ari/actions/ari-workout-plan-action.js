// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-workout-plan-action.js
// Version: 3.0.0
// Purpose:
//   SINGLE originator for Ari-created workout mutations.
//   Command meaning comes ONLY from the central OpenAI intent router.
//   All Training reads/builds/writes flow through WorkoutPlanController.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "3.0.0";
  const SOURCE = "ari_workout_action_v3_central_router";
  const CONFLICT_KEY = "ariWorkoutPlanConflict";
  const EDIT_KEY = "ariWorkoutEditContext";
  const INSTALL_FLAG = "__ariWorkoutActionV3";

  const clean = (value = "") => String(value ?? "").trim();

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
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(date);
  }

  function resolveRequestedDate(text = "", now = new Date()) {
    const value = clean(text).toLowerCase();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const iso = value.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (iso) {
      const date = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      return parseDateKey(formatDateKey(date)) ? formatDateKey(date) : null;
    }

    const slash = value.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?\b/);
    if (slash) {
      let year = slash[3] ? Number(slash[3]) : base.getFullYear();
      if (year < 100) year += 2000;
      let date = new Date(year, Number(slash[1]) - 1, Number(slash[2]));
      if (!slash[3] && date < base) date = new Date(year + 1, Number(slash[1]) - 1, Number(slash[2]));
      return formatDateKey(date);
    }

    if (/\btoday\b/.test(value)) return formatDateKey(base);
    if (/\btomorrow\b/.test(value)) {
      const date = new Date(base);
      date.setDate(date.getDate() + 1);
      return formatDateKey(date);
    }

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    for (let target = 0; target < weekdays.length; target += 1) {
      const match = value.match(new RegExp(`\\b(next\\s+|this\\s+)?${weekdays[target]}\\b`));
      if (!match) continue;
      let delta = (target - base.getDay() + 7) % 7;
      if (clean(match[1]).toLowerCase() === "next" && delta === 0) delta = 7;
      const date = new Date(base);
      date.setDate(date.getDate() + delta);
      return formatDateKey(date);
    }

    return null;
  }

  function isTrainingDecision(decision = {}) {
    const action = clean(decision.action);
    return (
      clean(decision.domain) === "training" &&
      ["plan_workout", "edit_workout"].includes(action) &&
      decision.needs_clarification !== true &&
      Number(decision.confidence || 0) >= 0.8
    );
  }

  function extractWorkoutRequest(message = "", decision = {}) {
    const entities = decision?.entities || {};
    const focusText = clean(entities.workout_focus).toLowerCase();
    const difficultyText = clean(entities.difficulty).toLowerCase();
    const durationValue = Number(entities.duration_minutes);

    const durationMinutes = Number.isFinite(durationValue) && durationValue >= 10
      ? Math.min(180, Math.round(durationValue))
      : 45;

    const difficulty = ["beginner", "intermediate", "advanced"].includes(difficultyText)
      ? difficultyText
      : "intermediate";

    const focusRules = [
      { test: /chest|pec/, id: "chest", title: "Chest Workout", goal: "muscle_building", bodyParts: ["chest"], modules: ["chest"] },
      { test: /back|lat/, id: "back", title: "Back Workout", goal: "muscle_building", bodyParts: ["back"], modules: ["back"] },
      { test: /shoulder|delt/, id: "shoulders", title: "Shoulder Workout", goal: "muscle_building", bodyParts: ["shoulders"], modules: ["shoulders"] },
      { test: /bicep/, id: "biceps", title: "Biceps Workout", goal: "muscle_building", bodyParts: ["arms"], modules: ["biceps"] },
      { test: /tricep/, id: "triceps", title: "Triceps Workout", goal: "muscle_building", bodyParts: ["arms"], modules: ["triceps"] },
      { test: /leg|lower body|quad|hamstring|glute/, id: "legs", title: "Lower Body Workout", goal: "lower_body_strength", bodyParts: ["lower_body"], modules: ["legs", "glutes", "calves"] },
      { test: /core|abs|abdominal/, id: "core", title: "Core Workout", goal: "core_strength", bodyParts: ["core"], modules: ["core"] },
      { test: /cardio|conditioning/, id: "cardio", title: "Cardio Workout", goal: "cardio", bodyParts: [], modules: ["cardio"] },
      { test: /run|running/, id: "running", title: "Running Workout", goal: "running", bodyParts: [], modules: ["cardio"] },
      { test: /mobility|stretch|flexibility/, id: "mobility", title: "Mobility Workout", goal: "mobility", bodyParts: [], modules: ["functional", "core"] },
      { test: /full body|total body/, id: "full_body", title: "Full Body Workout", goal: "general_fitness", bodyParts: [], modules: [] }
    ];

    const focus = focusRules.find(rule => rule.test.test(focusText)) || {
      id: "custom",
      title: focusText ? `${focusText.charAt(0).toUpperCase()}${focusText.slice(1)} Workout` : "Workout",
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
        includeFinisher: false,
        focusId: focus.id,
        requestedFromMessage: clean(message)
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

  async function inspectDate(scheduledDate) {
    const controller = await getController();
    const day = controller.getDate(scheduledDate);
    return hasWorkout(day)
      ? { day, title: describeWorkout(day), scheduled_date: scheduledDate, dateLabel: formatDateLabel(scheduledDate) }
      : null;
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

  function buildPendingAction(message, decision, scheduledDate, mode = "create") {
    const workout = extractWorkoutRequest(message, decision);
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
        existing_workout_mode: mode,
        intent_router: {
          domain: decision.domain,
          intent: decision.intent,
          target: decision.target,
          action: decision.action,
          confidence: decision.confidence,
          router_version: decision.router_version || null
        }
      },
      confirmation_text: `${verb} ${workout.displayTitle}${suffix}`
    };
  }

  CalBuddy.planWorkoutFromAri = async function planWorkoutFromAri(payload = {}) {
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
      detail: { scheduledDate, mode, source: SOURCE, version: VERSION }
    }));

    const actionWord = mode === "replace" ? "replaced" : mode === "add" ? "updated" : "set";
    return {
      success: true,
      workout: workoutToSave,
      scheduled_date: scheduledDate,
      reply: `${clean(workoutToSave.title) || "Workout"} is ${actionWord} for ${formatDateLabel(scheduledDate)}.`
    };
  };

  function install() {
    if (CalBuddy[INSTALL_FLAG]) return true;
    if (!CalBuddy?._askAriInternal || !CalBuddy?.createPendingAction || !CalBuddy?.executeAction) return false;

    const previousExecuteAction = CalBuddy.executeAction.bind(CalBuddy);
    const previousAskInternal = CalBuddy._askAriInternal.bind(CalBuddy);

    CalBuddy.executeAction = async function ariWorkoutExecutor(action = {}) {
      const type = clean(action.action_type || action.type);
      if (type === "plan_workout") {
        if (action.source && action.source !== SOURCE) {
          throw new Error("Rejected non-canonical workout action source.");
        }
        return await CalBuddy.planWorkoutFromAri(action.payload || {});
      }
      return await previousExecuteAction(action);
    };

    CalBuddy._askAriInternal = async function ariWorkoutActionRouter(input = {}) {
      const message = clean(input.message);

      // A constrained follow-up to a known workout conflict is safe to parse
      // locally because the target/date were already established by the router.
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
            scheduled_date: storedConflict.scheduled_date,
            intentDecision: input.intentDecision || null
          };
        }

        const pending = buildPendingAction(
          storedConflict.requested_message,
          storedConflict.intent_decision || {},
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
          existingWorkoutMode: choice,
          intentDecision: input.intentDecision || storedConflict.intent_decision || null
        };
      }

      const decision = input.intentDecision || null;
      if (!isTrainingDecision(decision)) {
        return await previousAskInternal(input);
      }

      const dateText = clean(decision?.entities?.workout_date_text) || message;
      const requestedDate = resolveRequestedDate(dateText) || resolveRequestedDate(message);

      if (!requestedDate) {
        return {
          reply: "What day do you want me to put that workout on — today, tomorrow, or a specific day?",
          pendingAction: null,
          emotion: "coach",
          workoutDateRequired: true,
          intentDecision: decision
        };
      }

      const existing = await inspectDate(requestedDate);

      if (clean(decision.action) === "edit_workout") {
        if (!existing) {
          return {
            reply: `I don’t see a workout planned for ${formatDateLabel(requestedDate)}. Do you want me to create one instead?`,
            pendingAction: null,
            emotion: "coach",
            intentDecision: decision
          };
        }

        localStorage.setItem(EDIT_KEY, JSON.stringify({
          scheduled_date: requestedDate,
          existing_title: existing.title,
          requested_message: message,
          router_entities: decision.entities || {},
          saved_at: new Date().toISOString()
        }));

        return {
          reply: `I found ${existing.title} for ${existing.dateLabel}. I’ll keep it intact until you confirm the exact change.`,
          pendingAction: null,
          emotion: "coach",
          workoutEditMode: true,
          scheduled_date: requestedDate,
          intentDecision: decision
        };
      }

      if (existing) {
        saveConflict({
          scheduled_date: requestedDate,
          requested_message: message,
          existing_title: existing.title,
          intent_decision: decision
        });

        return {
          reply: `You already have ${existing.title} planned for ${existing.dateLabel}. Do you want me to replace it, add the new work to it, or edit the existing workout?`,
          pendingAction: null,
          emotion: "coach",
          workoutPlanConflict: true,
          scheduled_date: requestedDate,
          intentDecision: decision
        };
      }

      const pending = buildPendingAction(message, decision, requestedDate, "create");
      const action = await CalBuddy.createPendingAction(pending);

      return {
        reply: action.confirmation_text,
        pendingAction: action,
        emotion: "coach",
        workoutPlanProposed: true,
        intentDecision: decision
      };
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI WORKOUT PLAN ACTION LOADED:", VERSION);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 240) window.clearInterval(timer);
  }, 50);
})();
