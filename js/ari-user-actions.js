// =====================================================
// ARI XP
// File: js/ari-user-actions.js
// Version: 1.0.0
// Purpose:
//   Deterministic user-facing app actions that must never be
//   represented as completed until ARI has a real executable action.
//
// Rules:
//   - Meal logging always becomes a real log_meal pending action.
//   - A direct meal request without calories is estimated first, then
//     presented for confirmation; ARI never merely says it was logged.
//   - Workout-plan creation requires an explicit calendar date.
//   - today / tomorrow / weekdays / written dates resolve to YYYY-MM-DD.
//   - No date means ARI asks for one and remembers the workout request.
//   - Confirmed workouts are written into the date-specific Training store.
// =====================================================

import WorkoutBuilder from "./training/workouts/workout-builder.js";
import WorkoutPlanStore from "./training/workout-plan-store.js";

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const INSTALL_FLAG = "__ariUserActionsV1";
  const PENDING_WORKOUT_KEY = "ariPendingWorkoutDateRequest";

  const WEEKDAYS = Object.freeze([
    "sunday", "monday", "tuesday", "wednesday",
    "thursday", "friday", "saturday"
  ]);

  const MONTHS = Object.freeze({
    january: 0, jan: 0,
    february: 1, feb: 1,
    march: 2, mar: 2,
    april: 3, apr: 3,
    may: 4,
    june: 5, jun: 5,
    july: 6, jul: 6,
    august: 7, aug: 7,
    september: 8, sep: 8, sept: 8,
    october: 9, oct: 9,
    november: 10, nov: 10,
    december: 11, dec: 11
  });

  function clean(value = "") {
    return String(value ?? "").trim();
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatDateKey(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function validLocalDate(year, monthIndex, day) {
    const date = new Date(year, monthIndex, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== monthIndex ||
      date.getDate() !== day
    ) {
      return null;
    }
    date.setHours(12, 0, 0, 0);
    return date;
  }

  function formatDateLabel(date) {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
    }).format(date);
  }

  function resolveWorkoutDate(message, reference = new Date()) {
    const original = clean(message);
    const text = original.toLowerCase();
    if (!text) return null;

    const base = new Date(reference);
    base.setHours(12, 0, 0, 0);

    if (/\btoday\b/.test(text)) {
      return makeResolvedDate(base, "today");
    }

    if (/\btomorrow\b/.test(text)) {
      const date = new Date(base);
      date.setDate(date.getDate() + 1);
      return makeResolvedDate(date, "tomorrow");
    }

    const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (iso) {
      const date = validLocalDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
      if (date) return makeResolvedDate(date, iso[0]);
    }

    const slash = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?\b/);
    if (slash) {
      let year = slash[3] ? Number(slash[3]) : base.getFullYear();
      if (year < 100) year += 2000;
      let date = validLocalDate(year, Number(slash[1]) - 1, Number(slash[2]));
      if (date && !slash[3] && date < startOfToday(base)) {
        date = validLocalDate(year + 1, Number(slash[1]) - 1, Number(slash[2]));
      }
      if (date) return makeResolvedDate(date, slash[0]);
    }

    const monthPattern = Object.keys(MONTHS).join("|");
    const written = text.match(new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(20\\d{2}))?\\b`, "i"));
    if (written) {
      let year = written[3] ? Number(written[3]) : base.getFullYear();
      let date = validLocalDate(year, MONTHS[written[1].toLowerCase()], Number(written[2]));
      if (date && !written[3] && date < startOfToday(base)) {
        date = validLocalDate(year + 1, MONTHS[written[1].toLowerCase()], Number(written[2]));
      }
      if (date) return makeResolvedDate(date, written[0]);
    }

    for (let target = 0; target < WEEKDAYS.length; target += 1) {
      const weekday = WEEKDAYS[target];
      const match = text.match(new RegExp(`\\b(next\\s+)?${weekday}\\b`, "i"));
      if (!match) continue;

      let delta = (target - base.getDay() + 7) % 7;
      if (match[1] && delta === 0) delta = 7;
      if (match[1] && delta > 0) {
        // "next Monday" means the next upcoming named weekday. If today is
        // Monday, that is seven days away; otherwise the upcoming Monday.
      }

      const date = new Date(base);
      date.setDate(date.getDate() + delta);
      return makeResolvedDate(date, match[0]);
    }

    return null;
  }

  function startOfToday(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  function makeResolvedDate(date, matchedText) {
    return {
      date: new Date(date),
      dateKey: formatDateKey(date),
      label: formatDateLabel(date),
      weekday: WEEKDAYS[date.getDay()],
      matchedText: clean(matchedText)
    };
  }

  function isWorkoutCreationRequest(message) {
    const text = clean(message).toLowerCase();
    if (!text) return false;

    const workoutNoun = /\b(workout|workout plan|training session|training plan|exercise plan|gym session)\b/.test(text);
    const creationVerb = /\b(make|create|build|plan|give|add|schedule|set up|put together|design)\b/.test(text);
    return workoutNoun && creationVerb;
  }

  function isMealLogRequest(message) {
    const text = clean(message).toLowerCase();
    if (!text) return false;

    return (
      /\b(log|track|save|add|record)\b.{0,60}\b(meal|food|breakfast|lunch|dinner|snack|calories|that|this|it)\b/.test(text) ||
      /\b(log|track|save|record)\b\s+(?:my\s+)?(?:\d+\s+)?[a-z]/.test(text) ||
      /\b(?:can you|could you|please)\b.{0,30}\b(log|track|save|record)\b/.test(text)
    );
  }

  function isReferentialMealRequest(message) {
    return /\b(?:log|add|track|save|record)\s+(?:that|it|this)(?:\s+meal)?\b/i.test(clean(message));
  }

  function extractExplicitCalories(message) {
    const text = clean(message).replace(/,/g, "");
    const match = text.match(/\b(\d{2,4})\s*(?:calories|cals|kcal)\b/i);
    const value = match ? Number(match[1]) : 0;
    return value >= 10 && value <= 6000 ? value : null;
  }

  function extractMealName(message) {
    let text = clean(message)
      .replace(/\b(?:can you|could you|would you|please)\b/gi, " ")
      .replace(/\b(?:log|track|save|add|record)\b/gi, " ")
      .replace(/\b(?:my|a|the)\s+(?:meal|food|breakfast|lunch|dinner|snack)\b/gi, " ")
      .replace(/\b\d{2,4}\s*(?:calories|cals|kcal)\b/gi, " ")
      .replace(/\s+/g, " ")
      .replace(/^[\s:,-]+|[\s:,-]+$/g, "")
      .trim();

    if (!text || /^(that|this|it)$/i.test(text)) return "Meal from Ari";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function extractCaloriesFromReply(reply) {
    const text = clean(reply).replace(/,/g, "");
    const range = text.match(/\b(\d{2,4})\s*(?:to|[-–])\s*(\d{2,4})\s*(?:calories|kcal|cals)\b/i);
    if (range) {
      const low = Number(range[1]);
      const high = Number(range[2]);
      const midpoint = Math.round((low + high) / 2);
      if (midpoint >= 10 && midpoint <= 6000) return midpoint;
    }

    const single = text.match(/\b(\d{2,4})\s*(?:calories|kcal|cals)\b/i);
    const value = single ? Number(single[1]) : 0;
    return value >= 10 && value <= 6000 ? value : null;
  }

  function buildMealAction({ name, calories, category = "Meal", servingSize = "Estimated by Ari" }) {
    const safeCalories = Number(calories || 0);
    if (!safeCalories || safeCalories <= 0) return null;

    return {
      action_type: "log_meal",
      payload: {
        name: clean(name) || "Meal from Ari",
        calories: Math.round(safeCalories),
        category,
        serving_size: servingSize
      },
      confirmation_text: `Log ${clean(name) || "that meal"} for about ${Math.round(safeCalories).toLocaleString()} calories?`
    };
  }

  function workoutOptionsFromMessage(message) {
    const text = clean(message).toLowerCase();
    const options = {
      goal: "general_fitness",
      durationMinutes: 45,
      difficulty: "beginner",
      includeWarmup: true,
      includeCooldown: true,
      includeFinisher: false,
      modules: [],
      bodyParts: []
    };

    const duration = text.match(/\b(\d{1,3})\s*(?:minute|min)\b/);
    if (duration) options.durationMinutes = Math.min(180, Math.max(10, Number(duration[1])));

    if (/\badvanced\b/.test(text)) options.difficulty = "advanced";
    else if (/\bintermediate\b/.test(text)) options.difficulty = "intermediate";

    const exerciseCount = text.match(/\b(\d{1,2})\s+exercises?\b/);
    if (exerciseCount) options.exerciseCount = Math.min(12, Math.max(1, Number(exerciseCount[1])));

    if (/\b(hypertrophy|bodybuilding|build muscle|muscle building)\b/.test(text)) {
      options.goal = "muscle_building";
    } else if (/\b(endurance)\b/.test(text)) {
      options.goal = "endurance";
    } else if (/\b(cardio)\b/.test(text)) {
      options.goal = "cardio";
    } else if (/\b(run|running)\b/.test(text)) {
      options.goal = "running";
    } else if (/\b(recovery)\b/.test(text)) {
      options.goal = "recovery";
    } else if (/\b(mobility|stretch|flexibility)\b/.test(text)) {
      options.goal = "mobility";
    } else if (/\bstrength\b/.test(text)) {
      options.goal = "strength";
    }

    const focusRules = [
      { re: /\bchest\b/, modules: ["chest"], title: "Chest Day", goal: "muscle_building" },
      { re: /\bback\b/, modules: ["back"], title: "Back Day", goal: "muscle_building" },
      { re: /\bshoulders?\b/, modules: ["shoulders"], title: "Shoulder Day", goal: "muscle_building" },
      { re: /\bbiceps?\b/, modules: ["biceps"], title: "Biceps Day", goal: "muscle_building" },
      { re: /\btriceps?\b/, modules: ["triceps"], title: "Triceps Day", goal: "muscle_building" },
      { re: /\barms?\b/, modules: ["biceps", "triceps", "forearms"], title: "Arm Day", goal: "muscle_building" },
      { re: /\b(legs?|lower body)\b/, modules: ["legs", "glutes", "calves"], title: "Leg Day", goal: "lower_body_strength" },
      { re: /\bglutes?\b/, modules: ["glutes"], title: "Glute Day", goal: "muscle_building" },
      { re: /\bcore|abs?\b/, modules: ["core"], title: "Core Day", goal: "core_strength" },
      { re: /\bfull body|total body\b/, modules: ["chest", "back", "shoulders", "legs", "glutes", "core"], title: "Full Body Workout", goal: "general_fitness" }
    ];

    for (const rule of focusRules) {
      if (!rule.re.test(text)) continue;
      options.modules = rule.modules;
      options.title = rule.title;
      if (options.goal === "general_fitness") options.goal = rule.goal;
      break;
    }

    if (options.goal === "cardio") options.title = options.title || "Cardio Session";
    if (options.goal === "endurance") options.title = options.title || "Endurance Session";
    if (options.goal === "running") options.title = options.title || "Running Session";

    return options;
  }

  function workoutExerciseNames(workout, limit = 6) {
    const names = [];
    for (const block of Array.isArray(workout?.blocks) ? workout.blocks : []) {
      for (const exercise of Array.isArray(block?.exercises) ? block.exercises : []) {
        if (["warmup", "cooldown"].includes(exercise?.role)) continue;
        const name = clean(exercise?.name);
        if (name && !names.includes(name)) names.push(name);
        if (names.length >= limit) return names;
      }
    }
    return names;
  }

  function createWorkoutPendingAction(message, resolvedDate) {
    const options = workoutOptionsFromMessage(message);
    const workout = WorkoutBuilder.build(options);
    const names = workoutExerciseNames(workout);
    const preview = names.length ? ` ${names.join(" • ")}.` : "";

    return {
      action_type: "create_workout_plan",
      payload: {
        date: resolvedDate.dateKey,
        date_label: resolvedDate.label,
        day: resolvedDate.weekday,
        workout,
        request: clean(message)
      },
      confirmation_text: `${workout.title || options.title || "Workout"} — ${resolvedDate.label}.${preview} Add this workout to ${resolvedDate.label}?`
    };
  }

  function savePendingWorkoutRequest(message) {
    const value = {
      request: clean(message),
      created_at: new Date().toISOString()
    };
    sessionStorage.setItem(PENDING_WORKOUT_KEY, JSON.stringify(value));
    return value;
  }

  function getPendingWorkoutRequest() {
    const raw = sessionStorage.getItem(PENDING_WORKOUT_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.request) return null;
      const age = Date.now() - new Date(parsed.created_at || 0).getTime();
      if (!Number.isFinite(age) || age > 30 * 60 * 1000) {
        sessionStorage.removeItem(PENDING_WORKOUT_KEY);
        return null;
      }
      return parsed;
    } catch {
      sessionStorage.removeItem(PENDING_WORKOUT_KEY);
      return null;
    }
  }

  async function createAndStorePendingAction(CalBuddy, action) {
    const pending = await CalBuddy.createPendingAction(action);
    CalBuddy.setAriMood?.("coach");
    return {
      reply: pending.confirmation_text || action.confirmation_text,
      pendingAction: pending,
      emotion: "coach",
      source: "ari-user-actions"
    };
  }

  async function estimateMealThenConfirm(CalBuddy, originalInternal, request, args) {
    const mealName = extractMealName(request);
    const estimatePrompt =
      `Estimate the calories for this meal as accurately as possible from the description. ` +
      `Include one best calorie estimate using the word calories. Do not say it was logged. Meal: ${mealName}`;

    const estimateResult = await originalInternal({
      ...args,
      message: estimatePrompt
    });

    if (estimateResult?.blocked) return estimateResult;

    const calories = extractCaloriesFromReply(estimateResult?.reply || "");
    if (!calories) {
      return {
        reply: "I can log that, but I need a little more detail first. Tell me the serving size or the calories you want recorded.",
        pendingAction: null,
        emotion: "coach",
        source: "ari-user-actions"
      };
    }

    const action = buildMealAction({
      name: mealName,
      calories,
      servingSize: "Estimated by Ari before logging"
    });

    CalBuddy.saveLastAriMealEstimate?.(action.payload);
    return await createAndStorePendingAction(CalBuddy, action);
  }

  async function executeWorkoutPlan(payload) {
    const dateKey = clean(payload?.date);
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(dateKey)) {
      throw new Error("Workout date is missing or invalid.");
    }

    const date = new Date(`${dateKey}T12:00:00`);
    if (Number.isNaN(date.getTime())) throw new Error("Workout date is invalid.");

    const day = WorkoutPlanStore.getDayIdFromDate(dateKey);
    const weekKey = WorkoutPlanStore.getWeekKey(dateKey);
    const workout = payload?.workout;

    if (!day || !weekKey || !workout) {
      throw new Error("Workout plan is incomplete.");
    }

    WorkoutPlanStore.hydrate();
    const saved = WorkoutPlanStore.setBuiltWorkout(day, workout, { weekKey });
    if (!saved) throw new Error("Workout could not be saved to that date.");

    WorkoutPlanStore.setSelectedWeek(weekKey);

    window.dispatchEvent(new CustomEvent("ari:workoutPlanCreated", {
      detail: {
        date: dateKey,
        dateLabel: payload.date_label || formatDateLabel(date),
        day,
        weekKey,
        title: workout.title || "Workout"
      }
    }));

    return {
      success: true,
      date: dateKey,
      dateLabel: payload.date_label || formatDateLabel(date),
      day,
      weekKey,
      workout,
      reply: `Done — I added ${workout.title || "your workout"} to ${payload.date_label || formatDateLabel(date)}.`
    };
  }

  function install() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy?._askAriInternal || !CalBuddy?.executeAction || !CalBuddy?.createPendingAction) {
      return false;
    }

    if (CalBuddy[INSTALL_FLAG]) return true;

    const originalInternal = CalBuddy._askAriInternal.bind(CalBuddy);
    const originalExecuteAction = CalBuddy.executeAction.bind(CalBuddy);

    CalBuddy.resolveWorkoutDate = resolveWorkoutDate;
    CalBuddy.isWorkoutCreationRequest = isWorkoutCreationRequest;
    CalBuddy.isMealLogRequest = isMealLogRequest;

    CalBuddy.executeAction = async function ariUserActionExecutor(action) {
      const type = action?.action_type || action?.type;
      if (type === "create_workout_plan") {
        return await executeWorkoutPlan(action.payload || {});
      }
      return await originalExecuteAction(action);
    };

    CalBuddy._askAriInternal = async function ariUserActionRouter(args = {}) {
      const message = clean(args.message);

      // A prior workout request with no date can be completed by a date-only
      // follow-up such as "Monday", "tomorrow", or "August 17".
      const waitingWorkout = getPendingWorkoutRequest();
      if (waitingWorkout && !isWorkoutCreationRequest(message)) {
        const resolvedFollowupDate = resolveWorkoutDate(message);
        if (resolvedFollowupDate) {
          sessionStorage.removeItem(PENDING_WORKOUT_KEY);
          const action = createWorkoutPendingAction(waitingWorkout.request, resolvedFollowupDate);
          return await createAndStorePendingAction(CalBuddy, action);
        }
      }

      if (isWorkoutCreationRequest(message)) {
        const resolvedDate = resolveWorkoutDate(message);
        if (!resolvedDate) {
          savePendingWorkoutRequest(message);
          CalBuddy.setAriMood?.("coach");
          return {
            reply: "Absolutely — what date do you want this workout for? You can say today, tomorrow, Monday, or a specific date.",
            pendingAction: null,
            emotion: "coach",
            source: "ari-user-actions",
            needsWorkoutDate: true
          };
        }

        sessionStorage.removeItem(PENDING_WORKOUT_KEY);
        const action = createWorkoutPendingAction(message, resolvedDate);
        return await createAndStorePendingAction(CalBuddy, action);
      }

      if (isMealLogRequest(message)) {
        const explicitCalories = extractExplicitCalories(message);
        if (explicitCalories) {
          const action = buildMealAction({
            name: extractMealName(message),
            calories: explicitCalories,
            servingSize: "Provided by user through Ari"
          });
          return await createAndStorePendingAction(CalBuddy, action);
        }

        if (isReferentialMealRequest(message)) {
          const estimate = await CalBuddy.getLastAriMealEstimate?.();
          if (estimate?.calories) {
            const action = buildMealAction({
              name: estimate.name,
              calories: estimate.calories,
              category: estimate.category,
              servingSize: estimate.serving_size
            });
            return await createAndStorePendingAction(CalBuddy, action);
          }
        }

        return await estimateMealThenConfirm(CalBuddy, originalInternal, message, args);
      }

      return await originalInternal(args);
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI USER ACTIONS INSTALLED:", VERSION);
    return true;
  }

  let attempts = 0;
  const tryInstall = () => {
    attempts += 1;
    if (install()) return;
    if (attempts < 120) window.setTimeout(tryInstall, 50);
  };

  tryInstall();
})();
