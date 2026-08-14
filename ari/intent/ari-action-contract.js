// ari/intent/ari-action-contract.js
// Purpose: Convert classified intent into safe app/developer action permission.
// V1.2.0 — Meal logging delegates exclusively to the canonical Rebirth action planner.

window.Ari = window.Ari || {};

window.Ari.actionContract = {
  version: "1.2.0",

  build(input = {}) {
    const intent = input.intent || {};
    const message = String(input.message || intent.originalMessage || "").trim();
    const context = input.context || input.userContext || {};
    const lastCalorieGoalSuggestion = input.lastCalorieGoalSuggestion || null;

    const base = {
      contractRan: true,
      contractVersion: this.version,
      lane: intent.lane || "conversation_only",
      wantsDataChange: intent.wantsDataChange === true,
      requiresApproval: true,
      allowedAction: null,
      action: null,
      shouldCreatePendingAction: false,
      shouldOnlyAnswer: true,
      reason: intent.reason || "No action contract reason."
    };

    if (!intent.wantsDataChange) {
      return base;
    }

    if (intent.lane === "explicit_log_request") {
      return this.buildLogContract(base, message);
    }

    if (intent.lane === "explicit_workout_plan") {
      return this.buildWorkoutPlanContract(base, message);
    }

    if (intent.lane === "explicit_goal_update") {
      return this.buildGoalContract(base, message, lastCalorieGoalSuggestion);
    }

    if (intent.lane === "explicit_profile_update") {
      return this.buildProfileContract(base, message);
    }

    if (intent.lane === "developer_action") {
      return this.buildDeveloperContract(base, message, context);
    }

    return base;
  },

  buildLogContract(base, message) {
    // SINGLE AUTHORITY RULE:
    // This contract may classify/permit a meal request, but it may NEVER build
    // a log_meal payload. ari-rebirth-action-planner.js is the only authority
    // allowed to construct meal writes, using only the current turn.
    return {
      ...base,
      allowedAction: "log_meal",
      action: null,
      shouldOnlyAnswer: false,
      shouldCreatePendingAction: false,
      reason:
        "Meal write delegated to canonical current-turn Rebirth action planner."
    };
  },

  buildWorkoutPlanContract(base, message) {
    const scheduledDate = this.resolveWorkoutDate(message);

    if (!scheduledDate) {
      return {
        ...base,
        shouldOnlyAnswer: true,
        shouldCreatePendingAction: false,
        reason: "Workout planning requires an explicit date. Ari must ask which day instead of assuming."
      };
    }

    const workout = this.extractWorkoutRequest(message);
    const dateLabel = this.formatWorkoutDateLabel(scheduledDate);

    return {
      ...base,
      shouldOnlyAnswer: false,
      shouldCreatePendingAction: true,
      allowedAction: "plan_workout",
      action: {
        action_type: "plan_workout",
        payload: {
          scheduled_date: scheduledDate,
          focus_id: workout.focusId,
          builder_request: workout.builderRequest,
          requested_from_message: message
        },
        confirmation_text: `Add ${workout.displayTitle} to ${dateLabel}?`
      },
      reason: `User explicitly requested a workout for exact calendar date ${scheduledDate}.`
    };
  },

  buildGoalContract(base, message, lastCalorieGoalSuggestion) {
    const explicitCalories = this.extractCalorieGoal(message);
    const calories = explicitCalories || lastCalorieGoalSuggestion?.calories;

    if (!calories) {
      return {
        ...base,
        shouldOnlyAnswer: true,
        shouldCreatePendingAction: false,
        reason: "User asked to update a goal, but no valid calorie goal was found."
      };
    }

    return {
      ...base,
      shouldOnlyAnswer: false,
      shouldCreatePendingAction: true,
      allowedAction: "update_profile",
      action: {
        action_type: "update_profile",
        payload: {
          daily_calorie_goal: calories,
          calorieGoal: calories
        },
        confirmation_text: `Update your daily calorie goal to ${Number(calories).toLocaleString()} kcal?`
      },
      reason: "User explicitly asked to update calorie goal."
    };
  },

  buildProfileContract(base, message) {
    const weight = this.extractWeight(message);

    if (weight) {
      return {
        ...base,
        shouldOnlyAnswer: false,
        shouldCreatePendingAction: true,
        allowedAction: "log_weight",
        action: {
          action_type: "log_weight",
          payload: {
            weight,
            notes: "Logged through Ari"
          },
          confirmation_text: `Log your current weight as ${weight} lb?`
        },
        reason: "User explicitly asked to log/update weight."
      };
    }

    return {
      ...base,
      shouldOnlyAnswer: true,
      shouldCreatePendingAction: false,
      reason: "Profile update intent detected, but no safe structured value was found."
    };
  },

  buildDeveloperContract(base, message, context) {
    if (context.ownerMode !== true) {
      return {
        ...base,
        shouldOnlyAnswer: true,
        shouldCreatePendingAction: false,
        reason: "Developer action requested, but Owner Mode is not active."
      };
    }

    return {
      ...base,
      shouldOnlyAnswer: false,
      shouldCreatePendingAction: false,
      allowedAction: "developer_intent",
      action: {
        type: "developer_investigation",
        enabled: true,
        title: "Owner requested app change",
        summary: message,
        priority: "medium",
        recommended_files: ["index.html", "style.css", "calbuddy-core.js", "ari/ari-rebirth-app-bridge.js"],
        ownerCommand: true
      },
      reason: "Owner requested a developer/app layout change."
    };
  },

  resolveWorkoutDate(message = "", now = new Date()) {
    const text = String(message || "").toLowerCase().trim();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const isoMatch = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (isoMatch) {
      return this.makeValidDateKey(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    }

    const slashMatch = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(20\d{2}|\d{2}))?\b/);
    if (slashMatch) {
      let year = slashMatch[3] ? Number(slashMatch[3]) : base.getFullYear();
      if (year < 100) year += 2000;
      const key = this.makeValidDateKey(year, Number(slashMatch[1]), Number(slashMatch[2]));
      if (key && !slashMatch[3]) {
        const candidate = this.parseDateKey(key);
        if (candidate && candidate < base) {
          return this.makeValidDateKey(year + 1, Number(slashMatch[1]), Number(slashMatch[2]));
        }
      }
      return key;
    }

    if (/\btoday\b/.test(text)) {
      return this.formatDateKey(base);
    }

    if (/\btomorrow\b/.test(text)) {
      const date = new Date(base);
      date.setDate(date.getDate() + 1);
      return this.formatDateKey(date);
    }

    const weekdayNames = [
      "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
    ];

    for (let target = 0; target < weekdayNames.length; target += 1) {
      const dayName = weekdayNames[target];
      const match = text.match(new RegExp(`\\b(next\\s+|this\\s+)?${dayName}\\b`));
      if (!match) continue;

      let delta = (target - base.getDay() + 7) % 7;
      const qualifier = String(match[1] || "").trim();

      if (qualifier === "next" && delta === 0) delta = 7;

      const date = new Date(base);
      date.setDate(date.getDate() + delta);
      return this.formatDateKey(date);
    }

    return null;
  },

  extractWorkoutRequest(message = "") {
    const text = String(message || "").toLowerCase();
    const durationMatch = text.match(/\b(\d{1,3})\s*(?:minute|minutes|min|mins)\b/);
    const durationMinutes = durationMatch
      ? Math.max(5, Math.min(180, Number(durationMatch[1])))
      : 45;

    const difficulty = /\b(advanced|hard|intense)\b/.test(text)
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
      { pattern: /\b(surf|surfing)\b/, id: "surfing", title: "Surf Performance Workout", goal: "athletic_performance", bodyParts: [], modules: ["surfing", "functional", "core", "shoulders", "back", "cardio"], sport: "surfing" },
      { pattern: /\b(full body|total body)\b/, id: "full_body", title: "Full Body Workout", goal: "general_fitness", bodyParts: [], modules: [] }
    ];

    const focus = focuses.find(item => item.pattern.test(text)) || {
      id: "custom",
      title: "Workout",
      goal: /\b(strength|stronger)\b/.test(text) ? "strength" : "general_fitness",
      bodyParts: [],
      modules: []
    };

    const builderRequest = {
      title: focus.title,
      goal: focus.goal,
      durationMinutes,
      difficulty,
      bodyParts: focus.bodyParts || [],
      modules: focus.modules || [],
      sport: focus.sport || null,
      includeWarmup: durationMinutes >= 15,
      includeCooldown: durationMinutes >= 20,
      includeFinisher: /\b(finisher|conditioning finisher)\b/.test(text)
    };

    return {
      focusId: focus.id,
      displayTitle: focus.title,
      builderRequest
    };
  },

  formatWorkoutDateLabel(dateKey) {
    const date = this.parseDateKey(dateKey);
    if (!date) return dateKey;

    try {
      return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric"
      }).format(date);
    } catch {
      return dateKey;
    }
  },

  makeValidDateKey(year, month, day) {
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return this.formatDateKey(date);
  },

  parseDateKey(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  },

  formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  },

  extractCalorieGoal(message = "") {
    const text = String(message).toLowerCase().replace(/,/g, "");
    const match =
      text.match(/\b(\d{4,5})\s*(?:calories|kcal)\b/) ||
      text.match(/\b(?:goal|target|daily calories|daily calorie goal).{0,30}?(\d{4,5})\b/);

    const value = match ? Number(match[1]) : null;
    if (!value || value < 1000 || value > 6000) return null;
    return value;
  },

  extractWeight(message = "") {
    const text = String(message).toLowerCase();
    const match = text.match(/\b(?:i weigh|my weight is|weight is|log my weight as|update my weight to|set my weight to)\s*(\d{2,3}(?:\.\d+)?)\b/);
    const value = match ? Number(match[1]) : null;
    if (!value || value < 70 || value > 700) return null;
    return value;
  }
};