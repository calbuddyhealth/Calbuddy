// =====================================================
// ARI REBIRTH
// File: ari/actions/ari-app-control-runtime.js
// Version: 1.0.0
// Purpose:
//   Give Ari a deterministic, authenticated application boundary for
//   reading the user's own CalBuddy data and performing the same kinds of
//   changes the user can make through the existing UI.
//
// Architectural rule:
//   OpenAI decides WHAT the user means and may propose an operation.
//   This runtime decides WHETHER that named operation is allowed and HOW it
//   is executed against the authenticated user's own application state.
//
// This file does not interpret conversational meaning and does not infer
// intent from keywords.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const CAPABILITIES = Object.freeze({
    view_goals: { domain: "goals", mode: "read", confirmation: false },
    view_nutrition: { domain: "nutrition", mode: "read", confirmation: false },
    view_workout_plan: { domain: "workout_plan", mode: "read", confirmation: false },
    view_ari_training: { domain: "ari_training", mode: "read", confirmation: false },
    view_ari_circle: { domain: "ari_circle", mode: "read", confirmation: false },
    view_ari_preferences: { domain: "ari_preferences", mode: "read", confirmation: false },

    update_goal_profile: { domain: "goals", mode: "write", confirmation: true },
    log_meal: { domain: "nutrition", mode: "write", confirmation: true },
    update_meal: { domain: "nutrition", mode: "write", confirmation: true },
    delete_meal: { domain: "nutrition", mode: "write", confirmation: true, destructive: true },
    log_weight: { domain: "goals", mode: "write", confirmation: true },
    log_calories_burned: { domain: "nutrition", mode: "write", confirmation: true },
    change_nutrition_reset_time: { domain: "nutrition", mode: "write", confirmation: true },

    set_workout_plan_name: { domain: "workout_plan", mode: "write", confirmation: true },
    set_workout_primary_goal: { domain: "workout_plan", mode: "write", confirmation: true },
    set_workout_day_type: { domain: "workout_plan", mode: "write", confirmation: true },
    set_workout_day_focus: { domain: "workout_plan", mode: "write", confirmation: true },
    set_workout_day_title: { domain: "workout_plan", mode: "write", confirmation: true },
    set_workout_day_duration: { domain: "workout_plan", mode: "write", confirmation: true },
    add_workout_exercise: { domain: "workout_plan", mode: "write", confirmation: true },
    update_workout_exercise: { domain: "workout_plan", mode: "write", confirmation: true },
    remove_workout_exercise: { domain: "workout_plan", mode: "write", confirmation: true },
    apply_workout_template: { domain: "workout_plan", mode: "write", confirmation: true },
    repeat_previous_workout_week: { domain: "workout_plan", mode: "write", confirmation: true },
    clear_workout_day: { domain: "workout_plan", mode: "write", confirmation: true, destructive: true },
    clear_workout_week: { domain: "workout_plan", mode: "write", confirmation: true, destructive: true },

    start_training_workout: { domain: "ari_training", mode: "write", confirmation: true },
    pause_training_workout: { domain: "ari_training", mode: "write", confirmation: true },
    resume_training_workout: { domain: "ari_training", mode: "write", confirmation: true },
    complete_training_workout: { domain: "ari_training", mode: "write", confirmation: true },
    cancel_training_workout: { domain: "ari_training", mode: "write", confirmation: true, destructive: true },
    set_training_average_heart_rate: { domain: "ari_training", mode: "write", confirmation: true },
    set_training_notes: { domain: "ari_training", mode: "write", confirmation: true },
    set_training_set_completed: { domain: "ari_training", mode: "write", confirmation: true },
    set_training_exercise_completed: { domain: "ari_training", mode: "write", confirmation: true },

    update_circle_profile: { domain: "ari_circle", mode: "write", confirmation: true },
    save_top_circle: { domain: "ari_circle", mode: "write", confirmation: true },
    send_circle_request: { domain: "ari_circle", mode: "write", confirmation: true, social: true },
    accept_circle_request: { domain: "ari_circle", mode: "write", confirmation: true, social: true },
    decline_circle_request: { domain: "ari_circle", mode: "write", confirmation: true, social: true },
    remove_circle_connection: { domain: "ari_circle", mode: "write", confirmation: true, destructive: true, social: true },
    block_circle_user: { domain: "ari_circle", mode: "write", confirmation: true, destructive: true, social: true },
    unblock_circle_user: { domain: "ari_circle", mode: "write", confirmation: true, social: true },

    update_ari_preferences: { domain: "ari_preferences", mode: "write", confirmation: true },
    reset_ari_preferences: { domain: "ari_preferences", mode: "write", confirmation: true }
  });

  const OPERATION_ALIASES = Object.freeze({
    update_profile: "update_goal_profile",
    update_goals: "update_goal_profile",
    update_goal_profile: "update_goal_profile",
    change_reset_time: "change_nutrition_reset_time",
    set_reset_time: "change_nutrition_reset_time",
    view_goal: "view_goals",
    get_goals: "view_goals",
    get_nutrition: "view_nutrition",
    get_workout_plan: "view_workout_plan",
    view_training: "view_ari_training",
    get_training: "view_ari_training",
    view_circle: "view_ari_circle",
    get_circle: "view_ari_circle",
    view_preferences: "view_ari_preferences",
    get_preferences: "view_ari_preferences",
    update_preferences: "update_ari_preferences"
  });

  const GOAL_PROFILE_FIELDS = Object.freeze({
    age: "age",
    sex: "sex",
    gender: "sex",
    weight: "weight_lbs",
    weight_lbs: "weight_lbs",
    current_weight: "weight_lbs",
    height: "height_in",
    height_in: "height_in",
    activity: "activity_level",
    activityLevel: "activity_level",
    activity_level: "activity_level",
    goalMode: "goal",
    goalType: "goal",
    goal: "goal",
    targetWeight: "target_weight_lbs",
    goal_weight: "target_weight_lbs",
    target_weight_lbs: "target_weight_lbs",
    weeklyChange: "weekly_weight_change_goal",
    weekly_weight_change_goal: "weekly_weight_change_goal",
    calorieGoal: "daily_calorie_goal",
    dailyCalorieGoal: "daily_calorie_goal",
    daily_calorie_goal: "daily_calorie_goal",
    restingHeartRate: "resting_heart_rate",
    resting_heart_rate: "resting_heart_rate",
    confirmedMaxHeartRate: "confirmed_max_heart_rate",
    confirmed_max_heart_rate: "confirmed_max_heart_rate"
  });

  const Runtime = {
    version: "1.0.0",
    source: "ari-app-control-runtime",
    authority: "authenticated_registered_application_operations_only",
    capabilities: CAPABILITIES,
    cache: {
      circle: null,
      circleAt: 0,
      preferences: null,
      preferencesAt: 0
    },

    normalizeOperation(value) {
      const raw = String(value || "").trim().toLowerCase();
      return OPERATION_ALIASES[raw] || raw || null;
    },

    getCapability(operation) {
      const normalized = this.normalizeOperation(operation);
      return normalized ? CAPABILITIES[normalized] || null : null;
    },

    getCapabilityManifest() {
      const operations = {};
      for (const [name, capability] of Object.entries(CAPABILITIES)) {
        operations[name] = {
          domain: capability.domain,
          mode: capability.mode,
          requiresConfirmation: capability.confirmation === true,
          destructive: capability.destructive === true,
          social: capability.social === true
        };
      }

      return {
        schema: "ari_app_capability_manifest",
        schemaVersion: "1.0.0",
        source: this.source,
        owner: "authenticated_user",
        scope: "current_user_owned_data_only",
        semanticAuthority: "openai",
        executionAuthority: this.source,
        operations
      };
    },

    normalizeProposedAction(action = {}) {
      if (!action || typeof action !== "object" || Array.isArray(action)) return null;

      const operation = this.normalizeOperation(
        action.operation ||
        action.action_type ||
        action.actionType ||
        action.type
      );

      const capability = this.getCapability(operation);
      if (!operation || !capability) return null;

      const payload = action.payload && typeof action.payload === "object" && !Array.isArray(action.payload)
        ? { ...action.payload }
        : {};

      return {
        operation,
        action_type: operation,
        type: operation,
        domain: capability.domain,
        payload,
        authorization:
          action.authorization ||
          action.authorizationSource ||
          "proposed",
        userAuthorized:
          action.userAuthorized === true ||
          action.authorization === "explicit_user_request",
        requiresApproval:
          capability.mode === "write"
            ? capability.confirmation !== false
            : false,
        destructive: capability.destructive === true,
        social: capability.social === true,
        confirmation_text:
          action.confirmation_text ||
          action.confirmationText ||
          this.buildConfirmationText(operation, payload),
        capability
      };
    },

    buildConfirmationText(operation, payload = {}) {
      const labels = {
        update_goal_profile: "update those goal/profile settings",
        log_meal: "log that meal",
        update_meal: "update that meal",
        delete_meal: "delete that meal",
        log_weight: "log that weight",
        log_calories_burned: "log those burned calories",
        change_nutrition_reset_time: "change your nutrition reset time",
        set_workout_plan_name: "change your workout plan name",
        set_workout_primary_goal: "change your workout goal",
        set_workout_day_type: "change that workout day",
        set_workout_day_focus: "change that day's training focus",
        set_workout_day_title: "rename that workout day",
        set_workout_day_duration: "change that workout duration",
        add_workout_exercise: "add that exercise to your plan",
        update_workout_exercise: "update that planned exercise",
        remove_workout_exercise: "remove that exercise from your plan",
        apply_workout_template: "apply that workout template",
        repeat_previous_workout_week: "repeat the previous workout week",
        clear_workout_day: "clear that workout day",
        clear_workout_week: "clear that workout week",
        start_training_workout: "start that workout",
        pause_training_workout: "pause that workout",
        resume_training_workout: "resume that workout",
        complete_training_workout: "complete that workout",
        cancel_training_workout: "cancel that workout",
        set_training_average_heart_rate: "save that average workout heart rate",
        set_training_notes: "save those workout notes",
        set_training_set_completed: "update that set",
        set_training_exercise_completed: "update that exercise",
        update_circle_profile: "update your ARI Circle profile",
        save_top_circle: "update your Top Circle",
        send_circle_request: "send that Circle request",
        accept_circle_request: "accept that Circle request",
        decline_circle_request: "decline that Circle request",
        remove_circle_connection: "remove that Circle connection",
        block_circle_user: "block that Circle user",
        unblock_circle_user: "unblock that Circle user",
        update_ari_preferences: "update your Ari preferences",
        reset_ari_preferences: "reset your Ari preferences"
      };

      const label = labels[operation] || "make that change";
      return `I can ${label}. Confirm?`;
    },

    safeJson(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },

    localDate(date = new Date()) {
      const value = date instanceof Date ? date : new Date(date);
      if (Number.isNaN(value.getTime())) return null;
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, "0");
      const d = String(value.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },

    currentWeekKey(date = new Date()) {
      const value = date instanceof Date ? new Date(date.getTime()) : new Date(date);
      if (Number.isNaN(value.getTime())) return null;
      value.setHours(0, 0, 0, 0);
      value.setDate(value.getDate() - value.getDay());
      return this.localDate(value);
    },

    readWorkoutPlanSnapshot() {
      const plan = this.safeJson("ari_training_workout_plan_v3", {}) || {};
      const currentWeekKey = this.currentWeekKey();
      const selectedWeekKey = plan.selectedWeekKey || plan.selected_week_key || currentWeekKey;
      const weeks = plan.weeks && typeof plan.weeks === "object" ? plan.weeks : {};
      const currentWeek = weeks[currentWeekKey] || null;
      const selectedWeek = weeks[selectedWeekKey] || currentWeek || null;

      return {
        available: Boolean(Object.keys(plan).length),
        currentWeekKey,
        selectedWeekKey,
        planName: plan.planName || plan.name || null,
        primaryGoalId: selectedWeek?.primaryGoalId || plan.primaryGoalId || null,
        currentWeek,
        selectedWeek
      };
    },

    readTrainingSnapshot() {
      const progress = this.safeJson("ari_training_workout_progress_v3", {}) || {};
      const activeSession = this.safeJson("ari_training_active_session_cache_v3", null);
      const completed = this.safeJson("ari_training_completed_sessions_v2", []);
      const today = this.localDate();
      const byDate = progress.byDate || progress.dates || progress.days || {};

      return {
        available: Boolean(Object.keys(progress).length || activeSession || (Array.isArray(completed) && completed.length)),
        today,
        todayProgress: byDate[today] || null,
        activeSession,
        recentCompletedSessions: Array.isArray(completed) ? completed.slice(-8) : [],
        selectedDate: localStorage.getItem("ari_training_selected_date_v1") || today
      };
    },

    async getCircleApi() {
      const module = await import("/js/ari-circle/data/circle-api.js?v=1.3.1");
      const api = module?.default;
      const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
      if (!api || !client) return null;
      try {
        api.configure({ client });
      } catch (error) {
        if (!api.state?.configured) throw error;
      }
      return api;
    },

    async readCircleSnapshot(userId, force = false) {
      const now = Date.now();
      if (!force && this.cache.circle && now - this.cache.circleAt < 30000) {
        return this.cache.circle;
      }

      try {
        const api = await this.getCircleApi();
        if (!api || !userId) return { available: false };

        const [profile, accepted, pending, topCircle] = await Promise.all([
          api.getProfileByUserId(userId),
          api.getAcceptedConnections(userId),
          api.getPendingConnectionRequests(userId),
          api.getTopCircle(userId)
        ]);

        const snapshot = {
          available: true,
          profile,
          acceptedConnections: Array.isArray(accepted) ? accepted.slice(0, 30) : [],
          pendingRequests: Array.isArray(pending) ? pending.slice(0, 30) : [],
          topCircle: Array.isArray(topCircle) ? topCircle : []
        };

        this.cache.circle = snapshot;
        this.cache.circleAt = now;
        return snapshot;
      } catch (error) {
        return {
          available: false,
          error: error?.message || String(error)
        };
      }
    },

    async readPreferencesSnapshot(userId, force = false) {
      const now = Date.now();
      if (!force && this.cache.preferences && now - this.cache.preferencesAt < 30000) {
        return this.cache.preferences;
      }

      try {
        const store = window.AriUserPreferenceStore || window.Ari?.userPreferenceStore;
        const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
        if (!store || !client || !userId) return { available: false };
        store.initialize?.({ supabaseClient: client });
        const result = await store.read(userId, { createIfMissing: true, useCache: !force });
        const snapshot = {
          available: result?.ok === true,
          preferences: result?.record?.preferenceOverrides || null,
          activePreset: result?.record?.activePreset || null,
          source: result?.source || store.source || "ari-user-preference-store"
        };
        this.cache.preferences = snapshot;
        this.cache.preferencesAt = now;
        return snapshot;
      } catch (error) {
        return { available: false, error: error?.message || String(error) };
      }
    },

    async buildUserSnapshot({ baseContext = {}, force = false } = {}) {
      const userId = baseContext.userId || baseContext.user?.id || null;
      const localGoals = this.safeJson("calbuddyGoals", {}) || {};
      const resetTime = this.safeJson("calbuddyResetTime", null);
      const workoutPlan = this.readWorkoutPlanSnapshot();
      const training = this.readTrainingSnapshot();

      const [circle, preferences] = await Promise.all([
        this.readCircleSnapshot(userId, force),
        this.readPreferencesSnapshot(userId, force)
      ]);

      return {
        schema: "ari_user_application_snapshot",
        schemaVersion: "1.0.0",
        source: this.source,
        userId,
        generatedAt: new Date().toISOString(),
        capabilities: this.getCapabilityManifest(),
        goals: {
          currentWeight: baseContext.currentWeight ?? localGoals.weight ?? null,
          goalWeight: baseContext.goalWeight ?? localGoals.targetWeight ?? null,
          dailyCalorieGoal: baseContext.dailyGoal ?? localGoals.calorieGoal ?? null,
          age: baseContext.age ?? localGoals.age ?? null,
          sex: baseContext.gender ?? localGoals.sex ?? null,
          height: baseContext.height ?? localGoals.height ?? null,
          activityLevel: baseContext.activityLevel ?? localGoals.activity ?? null,
          goalType: baseContext.goalType ?? localGoals.goalMode ?? null,
          weeklyChange: localGoals.weeklyChange ?? null,
          restingHeartRate: localGoals.restingHeartRate ?? localGoals.resting_heart_rate ?? null,
          confirmedMaxHeartRate: localGoals.confirmedMaxHeartRate ?? localGoals.confirmed_max_heart_rate ?? null,
          macroNutritionStrategy: localGoals.macroNutritionStrategy ?? null,
          dietPreference: localGoals.dietPreference ?? null,
          dietOther: localGoals.dietOther ?? null,
          foodAllergies: localGoals.foodAllergies ?? null,
          medicalConditions: localGoals.medicalConditions ?? null
        },
        nutrition: {
          nutritionDate: baseContext.nutritionDate || null,
          resetTime,
          caloriesConsumed: baseContext.caloriesConsumed ?? null,
          caloriesBurned: baseContext.caloriesBurned ?? null,
          caloriesLeft: baseContext.caloriesLeft ?? null,
          mealsToday: Array.isArray(baseContext.mealsToday) ? baseContext.mealsToday : [],
          recentMeals: Array.isArray(baseContext.recentMeals) ? baseContext.recentMeals : [],
          favoriteFoods: Array.isArray(baseContext.favoriteFoods) ? baseContext.favoriteFoods : []
        },
        workoutPlan,
        ariTraining: training,
        ariCircle: circle,
        ariPreferences: preferences,
        authority: {
          reads: "authenticated_user_owned_application_data",
          semanticInterpretation: "openai",
          writes: "registered_operations_only",
          arbitraryDatabaseAccess: false,
          crossUserWrites: false
        }
      };
    },

    async getWorkoutController() {
      const module = await import("/js/training/workout-plan-controller.js");
      const controller = module?.default;
      if (!controller) throw new Error("workout_plan_controller_unavailable");
      await controller.init?.({ client: window.calbuddySupabase || null });
      return controller;
    },

    async updateGoalProfile(payload = {}) {
      const profilePatch = {};
      const localPatch = {};

      for (const [key, value] of Object.entries(payload || {})) {
        if (value === undefined) continue;
        const profileKey = GOAL_PROFILE_FIELDS[key];
        if (profileKey) profilePatch[profileKey] = value;
        if ([
          "macroNutritionStrategy",
          "dietPreference",
          "dietOther",
          "foodAllergies",
          "medicalConditions",
          "restingHeartRate",
          "confirmedMaxHeartRate"
        ].includes(key)) {
          localPatch[key] = value;
        }
      }

      if (!Object.keys(profilePatch).length && !Object.keys(localPatch).length) {
        throw new Error("no_supported_goal_fields_supplied");
      }

      if (Object.keys(profilePatch).length) {
        const coreSupported = {};
        const extended = {};
        const coreKeys = new Set([
          "age", "sex", "weight_lbs", "height_in", "activity_level", "goal",
          "target_weight_lbs", "weekly_weight_change_goal", "daily_calorie_goal"
        ]);
        for (const [key, value] of Object.entries(profilePatch)) {
          (coreKeys.has(key) ? coreSupported : extended)[key] = value;
        }

        if (Object.keys(coreSupported).length && typeof window.CalBuddy.updateProfile === "function") {
          await window.CalBuddy.updateProfile(coreSupported);
        }

        if (Object.keys(extended).length) {
          const user = await window.CalBuddy.getCurrentUser?.();
          const client = window.calbuddySupabase || window.supabaseClient || null;
          if (user?.id && client) {
            const { error } = await client
              .from("profiles")
              .update({ ...extended, updated_at: new Date().toISOString() })
              .eq("id", user.id);
            if (error) console.warn("Optional goal-profile fields were not saved remotely:", error.message || error);
          }
        }
      }

      const goals = this.safeJson("calbuddyGoals", {}) || {};
      const merged = { ...goals };
      const localMappings = {
        age: "age",
        sex: "sex",
        weight_lbs: "weight",
        height_in: "height",
        activity_level: "activity",
        goal: "goalMode",
        target_weight_lbs: "targetWeight",
        weekly_weight_change_goal: "weeklyChange",
        daily_calorie_goal: "calorieGoal",
        resting_heart_rate: "restingHeartRate",
        confirmed_max_heart_rate: "confirmedMaxHeartRate"
      };
      for (const [key, value] of Object.entries(profilePatch)) {
        const localKey = localMappings[key];
        if (localKey) merged[localKey] = value;
      }
      Object.assign(merged, localPatch);
      localStorage.setItem("calbuddyGoals", JSON.stringify(merged));
      if (profilePatch.daily_calorie_goal !== undefined) {
        localStorage.setItem("calbuddyDailyCalorieGoal", String(profilePatch.daily_calorie_goal));
      }
      return { success: true, profilePatch, goals: merged };
    },

    async updateMeal(payload = {}) {
      const id = payload.id || payload.meal_id || payload.mealId;
      if (!id) throw new Error("meal_id_required");
      const allowed = ["name", "calories", "category", "protein_g", "carbs_g", "fat_g", "serving_size", "multiplier", "is_favorite", "nutrition_date"];
      const patch = {};
      for (const key of allowed) if (payload[key] !== undefined) patch[key] = payload[key];
      if (!Object.keys(patch).length) throw new Error("meal_update_fields_required");

      const user = await window.CalBuddy.getCurrentUser?.();
      const client = window.calbuddySupabase || window.supabaseClient || null;
      if (user?.id && client) {
        const { data, error } = await client.from("meals").update(patch).eq("id", id).eq("user_id", user.id).select("*").maybeSingle();
        if (error) throw error;
        window.CalBuddy.clearCalorieCache?.();
        await window.CalBuddy.refreshDashboard?.();
        return { success: true, meal: data };
      }

      const meals = this.safeJson("calbuddyMeals", []) || [];
      let updated = null;
      const next = meals.map(meal => {
        if (String(meal.id) !== String(id)) return meal;
        updated = { ...meal, ...patch };
        return updated;
      });
      localStorage.setItem("calbuddyMeals", JSON.stringify(next));
      window.CalBuddy.clearCalorieCache?.();
      await window.CalBuddy.refreshDashboard?.();
      return { success: Boolean(updated), meal: updated };
    },

    async deleteMeal(payload = {}) {
      const id = payload.id || payload.meal_id || payload.mealId;
      if (!id) throw new Error("meal_id_required");
      const user = await window.CalBuddy.getCurrentUser?.();
      const client = window.calbuddySupabase || window.supabaseClient || null;
      if (user?.id && client) {
        const { error } = await client.from("meals").delete().eq("id", id).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const meals = this.safeJson("calbuddyMeals", []) || [];
        localStorage.setItem("calbuddyMeals", JSON.stringify(meals.filter(meal => String(meal.id) !== String(id))));
      }
      window.CalBuddy.clearCalorieCache?.();
      await window.CalBuddy.refreshDashboard?.();
      return { success: true, deletedMealId: id };
    },

    async executeWorkoutOperation(operation, payload = {}) {
      const controller = await this.getWorkoutController();
      const date = payload.date || payload.day || new Date();
      let result = false;

      switch (operation) {
        case "set_workout_plan_name": result = controller.setPlanName(payload.name || payload.title, payload.weekKey); break;
        case "set_workout_primary_goal": result = controller.setPrimaryGoal(payload.goalId || payload.goal, payload.weekKey); break;
        case "set_workout_day_type": result = controller.setDateType(date, payload.dayType || payload.type); break;
        case "set_workout_day_focus": result = controller.setDateFocus(date, payload.focusId || payload.focus); break;
        case "set_workout_day_title": result = controller.setDateTitle(date, payload.title); break;
        case "set_workout_day_duration": result = controller.setDateDuration(date, payload.minutes || payload.durationMinutes); break;
        case "add_workout_exercise": result = controller.addExercise(date, payload.exerciseId, payload.options || payload.prescription || {}); break;
        case "update_workout_exercise": result = controller.updateExercise(date, Number(payload.index), payload.patch || payload.updates || {}); break;
        case "remove_workout_exercise": result = controller.removeExercise(date, Number(payload.index)); break;
        case "apply_workout_template": result = controller.applyTemplate(payload.templateId, { weekStart: payload.weekKey || payload.weekStart }); break;
        case "repeat_previous_workout_week": result = controller.repeatPreviousWeek(payload.weekKey || payload.weekStart, payload.options || {}); break;
        case "clear_workout_day": result = controller.clearDate(date); break;
        case "clear_workout_week": result = controller.clearWeek(payload.weekKey || payload.weekStart); break;
        default: throw new Error(`unsupported_workout_operation:${operation}`);
      }

      if (!result) throw new Error(`${operation}_was_not_applied`);
      await controller.save?.({ remote: true });
      return { success: true, operation, result, snapshot: controller.getSelectedWeek?.() || controller.getPlan?.() || null };
    },

    async executeTrainingOperation(operation, payload = {}) {
      const controller = await this.getWorkoutController();
      const date = payload.date || new Date();
      let result = false;
      switch (operation) {
        case "start_training_workout": result = controller.startWorkout(date); break;
        case "pause_training_workout": result = controller.pauseWorkout(date); break;
        case "resume_training_workout": result = controller.resumeWorkout(date); break;
        case "complete_training_workout": result = controller.completeWorkout(date, payload.options || {}); break;
        case "cancel_training_workout": result = controller.cancelWorkout(date); break;
        case "set_training_average_heart_rate": result = controller.setAverageHeartRate(date, payload.heartRate ?? payload.averageHeartRate); break;
        case "set_training_notes": result = controller.setWorkoutNotes(date, payload.notes || ""); break;
        case "set_training_set_completed": result = controller.setSetCompleted(payload); break;
        case "set_training_exercise_completed": result = controller.setExerciseCompleted(payload); break;
        default: throw new Error(`unsupported_training_operation:${operation}`);
      }
      if (!result) throw new Error(`${operation}_was_not_applied`);
      return { success: true, operation, result, progress: controller.getDateProgress?.(date) || null };
    },

    async executeCircleOperation(operation, payload = {}) {
      const api = await this.getCircleApi();
      if (!api) throw new Error("ari_circle_api_unavailable");
      const userId = await api.getAuthenticatedUserId();
      if (!userId) throw new Error("authenticated_user_required");
      let result;

      switch (operation) {
        case "update_circle_profile": {
          const current = await api.ensureOwnProfile({ userId });
          const protectedKeys = new Set(["user_id", "userId", "id"]);
          const patch = {};
          for (const [key, value] of Object.entries(payload || {})) if (!protectedKeys.has(key)) patch[key] = value;
          result = await api.saveProfile({ ...current, ...patch, user_id: userId }, { ownerUserId: userId });
          break;
        }
        case "save_top_circle":
          result = await api.saveTopCircle({ ownerUserId: userId, limit: payload.limit || payload.topCircleLimit || 6, members: payload.members || [] });
          break;
        case "send_circle_request":
          result = await api.createConnectionRequest({ requesterUserId: userId, addresseeUserId: payload.targetUserId || payload.userId });
          break;
        case "accept_circle_request":
          result = await api.updateConnectionStatus(payload.connectionId || payload.requestId, "accepted");
          break;
        case "decline_circle_request":
          result = await api.updateConnectionStatus(payload.connectionId || payload.requestId, "declined");
          break;
        case "remove_circle_connection":
          result = await api.deleteConnection(payload.connectionId);
          break;
        case "block_circle_user":
          result = await api.blockUser(payload.targetUserId || payload.userId);
          break;
        case "unblock_circle_user":
          result = await api.unblockUser(payload.targetUserId || payload.userId);
          break;
        default:
          throw new Error(`unsupported_circle_operation:${operation}`);
      }

      this.cache.circle = null;
      this.cache.circleAt = 0;
      return { success: true, operation, result };
    },

    async executePreferenceOperation(operation, payload = {}) {
      const store = window.AriUserPreferenceStore || window.Ari?.userPreferenceStore;
      const client = window.calbuddySupabase || window.supabaseClient || null;
      const user = await window.CalBuddy.getCurrentUser?.();
      if (!store || !client || !user?.id) throw new Error("ari_preference_store_unavailable");
      store.initialize?.({ supabaseClient: client });
      let result;
      if (operation === "update_ari_preferences") {
        const changes = payload.preferences || payload.changes || payload;
        result = await store.patch(user.id, changes, { activePreset: "custom", changeSource: "ari" });
      } else if (operation === "reset_ari_preferences") {
        if (typeof store.resetAll !== "function") throw new Error("ari_preference_reset_unavailable");
        result = await store.resetAll(user.id, { changeSource: "ari" });
      } else {
        throw new Error(`unsupported_preference_operation:${operation}`);
      }
      if (result?.ok !== true) throw new Error(result?.error?.message || result?.error || "ari_preference_update_failed");
      this.cache.preferences = null;
      this.cache.preferencesAt = 0;
      return { success: true, operation, result };
    },

    async execute(action = {}) {
      const normalized = this.normalizeProposedAction(action) || this.normalizeProposedAction({
        operation: action.operation || action.action_type || action.type,
        payload: action.payload || {},
        authorization: action.authorization,
        userAuthorized: action.userAuthorized
      });
      if (!normalized) throw new Error("unregistered_ari_application_operation");
      const { operation, payload, capability } = normalized;

      if (capability.mode === "read") {
        const snapshot = await this.buildUserSnapshot({ baseContext: await this.getBaseContextWithoutRecursion(), force: true });
        const domainKey = {
          view_goals: "goals",
          view_nutrition: "nutrition",
          view_workout_plan: "workoutPlan",
          view_ari_training: "ariTraining",
          view_ari_circle: "ariCircle",
          view_ari_preferences: "ariPreferences"
        }[operation];
        return { success: true, operation, result: snapshot[domainKey] || null };
      }

      switch (operation) {
        case "update_goal_profile": return this.updateGoalProfile(payload);
        case "log_meal": return window.CalBuddy.logMeal(payload);
        case "update_meal": return this.updateMeal(payload);
        case "delete_meal": return this.deleteMeal(payload);
        case "log_weight": return window.CalBuddy.logWeight(payload);
        case "log_calories_burned": return window.CalBuddy.logCaloriesBurned(payload);
        case "change_nutrition_reset_time": return window.CalBuddy.changeResetTime(payload);
      }

      if (capability.domain === "workout_plan") return this.executeWorkoutOperation(operation, payload);
      if (capability.domain === "ari_training") return this.executeTrainingOperation(operation, payload);
      if (capability.domain === "ari_circle") return this.executeCircleOperation(operation, payload);
      if (capability.domain === "ari_preferences") return this.executePreferenceOperation(operation, payload);

      throw new Error(`registered_operation_has_no_executor:${operation}`);
    },

    async getBaseContextWithoutRecursion() {
      const user = await window.CalBuddy.getCurrentUser?.();
      return { userId: user?.id || null, user };
    },

    installCalBuddyExtensions() {
      const cal = window.CalBuddy;
      if (!cal || cal.__ariAppControlInstalled === true) return;
      cal.__ariAppControlInstalled = true;

      const originalPermissions = typeof cal.getAriPermissions === "function"
        ? cal.getAriPermissions.bind(cal)
        : (() => ({}));

      cal.getAriPermissions = context => ({
        ...originalPermissions(context),
        read_goals: true,
        read_nutrition: true,
        read_workout_plan: true,
        read_ari_training: true,
        read_ari_circle: true,
        read_ari_preferences: true,
        update_goals: true,
        update_nutrition: true,
        update_workout_plan: true,
        update_ari_training: true,
        update_ari_circle: true,
        update_ari_preferences: true,
        registered_app_operations_only: true,
        arbitrary_database_write: false
      });

      if (typeof cal.getUserContext === "function") {
        const originalGetUserContext = cal.getUserContext.bind(cal);
        cal.getUserContext = async (...args) => {
          const context = await originalGetUserContext(...args);
          context.ariPermissions = cal.getAriPermissions(context);
          try {
            context.ariAppAccess = await Runtime.buildUserSnapshot({ baseContext: context });
          } catch (error) {
            context.ariAppAccess = {
              available: false,
              error: error?.message || String(error),
              capabilities: Runtime.getCapabilityManifest()
            };
          }
          return context;
        };
      }

      if (typeof cal.executeAction === "function") {
        const originalExecuteAction = cal.executeAction.bind(cal);
        cal.executeAction = async action => {
          const operation = Runtime.normalizeOperation(action?.action_type || action?.type || action?.operation);
          if (Runtime.getCapability(operation)) {
            return Runtime.execute({ ...action, operation, payload: action?.payload || {} });
          }
          return originalExecuteAction(action);
        };
      }
    },

    patchRuntimeRequest() {
      const request = window.AriRuntimeRequest || window.Ari?.runtimeRequest;
      if (!request || request.__ariAppControlPatched === true) return;
      request.__ariAppControlPatched = true;

      const originalPermissions = typeof request.buildApplicationPermissions === "function"
        ? request.buildApplicationPermissions.bind(request)
        : (() => ({}));

      request.buildApplicationPermissions = options => ({
        ...originalPermissions(options),
        allowUserOwnedReads: true,
        allowRegisteredUserEdits: true,
        allowToolExecution: true,
        allowDirectWrites: false,
        requireApprovalForActions: true,
        requireApprovalForDestructiveActions: true,
        registeredOperationsOnly: true,
        capabilityManifest: Runtime.getCapabilityManifest(),
        authority: "registered_application_permission_boundary"
      });
    },

    install() {
      this.installCalBuddyExtensions();
      this.patchRuntimeRequest();
      window.Ari.appControlRuntime = this;
      window.AriAppControlRuntime = this;
      return this;
    }
  };

  Runtime.install();
})();