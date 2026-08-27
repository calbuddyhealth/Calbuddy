// ARI vNext — Phase 8C final trusted execution cutover.
//
// Every model-visible vNext mutation now enters the canonical operation registry
// for prepare, pending creation, and confirmed execution. Phase 8B domain writers
// remain authoritative, but the captured pre-registry adapter stack is no longer
// required for any supported model-visible mutation.
//
// Trust invariants remain unchanged:
// - Current-turn language authorizes a mutation; references only identify targets.
// - Confirmation is still required before execution.
// - Domain services / canonical state are re-read by their existing trusted writers.
// - Failed execution preserves retryable pending state through the registry hook.
// - No additional OpenAI/reference-resolution call is introduced.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_operation_registry_phase8c";
  const INSTALL_FLAG = "__ariOperationRegistryPhase8C";
  const RESOLVED_MUTATION_PREFIX = "ari_resolved_nutrition_mutation_v1";

  const CIRCLE_OPERATIONS = [
    "create_circle_meetup",
    "join_circle_meetup",
    "leave_circle_meetup",
    "cancel_circle_meetup",
    "create_circle_mission",
    "join_circle_mission",
    "submit_circle_mission_progress",
    "create_circle_crew",
    "accept_circle_crew_invite",
    "decline_circle_crew_invite",
    "leave_circle_crew",
    "archive_circle_crew"
  ];

  const GENERIC_REGISTRY_OPERATIONS = [
    "log_meal",
    "log_activity",
    "log_weight",
    "update_goal",
    "plan_meal",
    "log_planned_meal",
    ...CIRCLE_OPERATIONS
  ];

  const SPECIAL_WORKOUT_OPERATIONS = ["plan_workout", "edit_workout"];

  const MODEL_MUTATION_OPERATIONS = Object.freeze([
    ...GENERIC_REGISTRY_OPERATIONS,
    ...SPECIAL_WORKOUT_OPERATIONS,
    "update_nutrition_meal",
    "undo_nutrition_mutation",
    "update_weight_log",
    "delete_weight_log",
    "update_activity_log",
    "delete_activity_log",
    "edit_referenced_workout",
    "delete_workout",
    "log_referenced_planned_meal",
    "log_referenced_plan_components",
    "discard_referenced_meal_plan",
    "replace_referenced_meal_plan"
  ]);

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  function clean(value = "", max = 500) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function finite(value, fallback = null) {
    if (value === null || value === undefined || value === "") return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function failure(code, message, extra = {}) {
    return { success: false, code, message, ...extra };
  }

  function pendingFrom(input = {}) {
    return input?.vnextPendingAction || input || {};
  }

  function actionWithTurnIdentity(action = {}, pending = {}, currentTurnId = null) {
    return {
      ...action,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_confirmation_turn_id: clean(currentTurnId, 200) || null,
      vnext_source: SOURCE
    };
  }

  async function createStoredPending(pending = {}) {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter?.prepareCalBuddyAction || typeof window.CalBuddy?.createPendingAction !== "function") {
      return failure("pending_action_service_unavailable", "Ari could not prepare that change safely.");
    }

    const prepared = await adapter.prepareCalBuddyAction(pending);
    if (!prepared?.success || !prepared?.action) return prepared || failure("operation_prepare_failed", "That change could not be prepared safely.");

    const stored = await window.CalBuddy.createPendingAction(prepared.action);
    const wrapped = {
      ...stored,
      vnext_action_id: pending.id,
      vnext_source_turn_id: pending.sourceTurnId,
      vnext_expires_at: pending.expiresAt || null,
      vnext_source: SOURCE
    };
    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped, resolution: prepared.resolution || null };
  }

  async function executePreparedApplication(input = {}) {
    const pending = pendingFrom(input);
    const adapter = window.AriVNextActionAdapter;
    if (!adapter?.prepareCalBuddyAction || typeof window.CalBuddy?.executeAction !== "function") {
      return failure("action_executor_unavailable", "Ari's trusted application executor is unavailable.");
    }

    const prepared = await adapter.prepareCalBuddyAction(pending);
    if (!prepared?.success || !prepared?.action) return prepared || failure("operation_prepare_failed", "That change could not be prepared safely.");

    const action = actionWithTurnIdentity(prepared.action, pending, input?.currentTurnId);
    try {
      const result = await window.CalBuddy.executeAction(action);
      if (result?.success === false) return result;
      return {
        success: true,
        result,
        action,
        ...(clean(result?.reply, 2000) ? { reply: clean(result.reply, 2000) } : {})
      };
    } catch (error) {
      return failure("trusted_application_execution_failed", error?.message || "That change could not be completed.");
    }
  }

  async function executeWorkout(input = {}) {
    const pending = pendingFrom(input);
    const adapter = window.AriVNextActionAdapter;
    if (!adapter) return failure("training_controller_unavailable", "Ari's trusted Training adapter is unavailable.");

    const prepared = await adapter.prepareCalBuddyAction?.(pending);
    if (!prepared?.success || !prepared?.action) return prepared || failure("workout_prepare_failed", "That workout change could not be prepared safely.");

    if (pending.name === "plan_workout") {
      if (typeof adapter.executeValidatedWorkout !== "function") return failure("training_executor_unavailable", "The validated workout executor is unavailable.");
      return await adapter.executeValidatedWorkout({ action: prepared.action, pending, currentTurnId: input?.currentTurnId || null });
    }

    if (pending.name === "edit_workout") {
      if (typeof adapter.executeValidatedWorkoutEdit !== "function") return failure("training_executor_unavailable", "The validated workout edit executor is unavailable.");
      return await adapter.executeValidatedWorkoutEdit({ action: prepared.action, pending, currentTurnId: input?.currentTurnId || null });
    }

    return failure("unsupported_workout_operation", "That workout operation is not supported.");
  }

  function makeUuid() {
    try {
      if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    } catch {}
    const bytes = new Uint8Array(16);
    try { window.crypto?.getRandomValues?.(bytes); } catch {
      for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function hashText(value = "") {
    const text = String(value || "");
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }

  function mutationIdForAction(action = {}) {
    const identity = clean(action?.vnext_action_id || action?.vnext_source_turn_id, 220) || "fallback";
    const key = `${RESOLVED_MUTATION_PREFIX}:${hashText(identity)}`;
    try {
      const existing = sessionStorage.getItem(key);
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing || "")) return { id: existing, key };
      const id = makeUuid();
      sessionStorage.setItem(key, id);
      return { id, key };
    } catch {
      return { id: makeUuid(), key: null };
    }
  }

  async function currentSession() {
    try {
      if (typeof window.CalBuddy?.getCurrentSession === "function") return await window.CalBuddy.getCurrentSession();
    } catch {}
    try {
      const { data } = await window.calbuddySupabase?.auth?.getSession?.();
      return data?.session || null;
    } catch {
      return null;
    }
  }

  async function nutritionDate() {
    try {
      const value = clean((await window.CalBuddy?.getNutritionWindow?.())?.nutritionDate, 20);
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    } catch {}
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  async function executeResolvedMeal(action = {}) {
    const payload = object(action?.payload);
    if (payload.vnext_resolved_nutrition !== true) {
      return failure("unresolved_nutrition_blocked", "Nutrition must be resolved through Ari's evidence resolver before logging.");
    }

    const client = window.calbuddySupabase;
    const session = await currentSession();
    if (!session?.user?.id || typeof client?.rpc !== "function") {
      return failure("resolved_nutrition_session_required", "A signed-in ARI XP session is required to save resolved nutrition.");
    }

    const calories = Math.round(finite(payload.calories, 0));
    if (!clean(payload.name, 220) || calories <= 0 || calories > 10000) {
      return failure("resolved_nutrition_payload_invalid", "The resolved meal did not pass Ari's ledger validation.");
    }

    const mutation = mutationIdForAction(action);
    const date = await nutritionDate();
    const meal = {
      name: clean(payload.name, 220),
      calories,
      category: clean(payload.category, 80) || "Meal",
      nutrition_date: date,
      protein_g: Math.max(0, finite(payload.protein_g, 0)),
      carbs_g: Math.max(0, finite(payload.carbs_g, 0)),
      fat_g: Math.max(0, finite(payload.fat_g, 0)),
      serving_size: clean(payload.serving_size, 500) || "Resolved by Ari Nutrition",
      multiplier: 1,
      is_favorite: false,
      created_at: new Date().toISOString()
    };

    window.CalBuddy?.setAriMood?.("logging");
    const { data, error } = await client.rpc("ari_log_resolved_nutrition_meal", {
      p_mutation_id: mutation.id,
      p_meal: meal,
      p_components: Array.isArray(payload.ari_components) ? payload.ari_components : [],
      p_resolution: object(payload.ari_resolution)
    });

    if (error) {
      window.CalBuddy?.setAriMood?.("concerned");
      return failure("resolved_nutrition_write_failed", error.message || "The resolved meal could not be saved. Nothing was changed.");
    }

    try { if (mutation.key) sessionStorage.removeItem(mutation.key); } catch {}
    const saved = data?.meal && typeof data.meal === "object" ? { ...data.meal, source: "supabase" } : { ...meal, id: data?.mealId || null, source: "supabase" };
    saved.ari_mutation_id = mutation.id;
    saved.ari_today_calories = finite(data?.todayCalories, null);
    saved.ari_undo_available = data?.undoAvailable === true;
    saved.ari_resolution = data?.resolution || payload.ari_resolution || null;

    try {
      if (Number.isFinite(Number(data?.todayCalories))) {
        localStorage.setItem("calbuddyCaloriesConsumed", String(Math.round(Number(data.todayCalories))));
        localStorage.setItem("calbuddyCaloriesConsumedDate", String(data?.nutritionDate || date));
      }
      window.dispatchEvent(new CustomEvent("ari:nutritionMutationCommitted", { detail: { action: "log_meal", mutationId: mutation.id, meal: saved, todayCalories: data?.todayCalories ?? null, undoAvailable: data?.undoAvailable === true, resolution: saved.ari_resolution, source: SOURCE, version: VERSION } }));
      window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", { detail: { action: "log", meal: saved, mutationId: mutation.id } }));
    } catch {}

    window.CalBuddy?.setAriMood?.("success");
    return {
      success: true,
      result: saved,
      meal: saved,
      mutationId: mutation.id,
      todayCalories: data?.todayCalories ?? null,
      undoAvailable: data?.undoAvailable === true,
      resolution: saved.ari_resolution,
      reply: `${saved.name || "Meal"} logged${Number.isFinite(Number(data?.todayCalories)) ? ` · ${Math.round(Number(data.todayCalories)).toLocaleString()} kcal today` : ""}.`
    };
  }

  async function executeWeight(action = {}) {
    if (typeof window.CalBuddy?.logWeight !== "function") return failure("weight_executor_unavailable", "The trusted weight writer is unavailable.");
    try {
      const result = await window.CalBuddy.logWeight(action?.payload || {});
      return { success: true, result, weight: result, reply: "Weight logged." };
    } catch (error) {
      return failure("weight_log_failed", error?.message || "Weight could not be logged.");
    }
  }

  async function executeGoal(action = {}) {
    if (typeof window.CalBuddy?.updateProfile !== "function") return failure("goal_executor_unavailable", "The trusted goal/profile writer is unavailable.");
    try {
      const result = await window.CalBuddy.updateProfile(action?.payload || {});
      return { success: true, result, reply: "Goal updated." };
    } catch (error) {
      return failure("goal_update_failed", error?.message || "Goal could not be updated.");
    }
  }

  async function refreshMealPlan(action = "plan_changed", detail = {}) {
    try { await window.AriNutritionPage?.refresh?.(); } catch {}
    try { await window.CalBuddy?.getConsumedCalories?.(); } catch {}
    try {
      window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", { detail: { action, source: SOURCE, version: VERSION, ...detail } }));
      window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", { detail: { action, source: SOURCE, ...detail } }));
    } catch {}
  }

  async function executePlanMeal(action = {}) {
    const sync = window.AriNutritionPlanSync;
    const meals = Array.isArray(action?.payload?.meals) ? action.payload.meals.slice(0, 4) : [];
    if (!sync?.pushRecords || !sync?.loadToday || !meals.length) return failure("meal_plan_executor_unavailable", "Today's trusted Meal Plan service is unavailable.");

    try {
      const written = await sync.pushRecords(meals.map((meal) => ({ ...meal, status: "planned", updated_at: new Date().toISOString() })));
      const current = await sync.loadToday();
      const expected = new Set(meals.map((meal) => clean(meal.meal_slot, 40)));
      const verified = (Array.isArray(current) ? current : []).filter((meal) => expected.has(clean(meal?.meal_slot, 40)));
      if (verified.length < expected.size) return failure("meal_plan_write_not_verified", "Ari could not verify every planned meal after saving, so the plan was not reported as complete.");
      await refreshMealPlan("plan_created", { mealSlots: [...expected] });
      return { success: true, result: { meals: verified, written }, reply: verified.length === 1 ? `${verified[0].name || "Meal"} added to today's Meal Plan.` : "Today's Meal Plan was updated." };
    } catch (error) {
      return failure("meal_plan_write_failed", error?.message || "Today's Meal Plan could not be saved.");
    }
  }

  async function executeLogPlannedMeal(action = {}) {
    const sync = window.AriNutritionPlanSync;
    const client = window.calbuddySupabase;
    const slot = clean(action?.payload?.meal_slot, 40).toLowerCase();
    if (!sync?.loadToday || typeof client?.rpc !== "function" || !["breakfast", "lunch", "dinner", "snack"].includes(slot)) {
      return failure("planned_meal_executor_unavailable", "Today's planned meal could not be resolved safely.");
    }

    const current = await sync.loadToday();
    const matches = (Array.isArray(current) ? current : []).filter((plan) => clean(plan?.meal_slot, 40).toLowerCase() === slot && clean(plan?.status || "planned", 40) === "planned");
    if (matches.length !== 1 || !clean(matches[0]?.id, 180)) return failure("planned_meal_target_ambiguous", `Ari could not resolve exactly one active ${slot} plan.`);
    const plan = matches[0];
    const mutationId = makeUuid();
    const consumed = {
      name: clean(plan.name, 180) || "Meal",
      calories: Math.max(1, Math.round(finite(plan.calories, 0))),
      category: `${slot.charAt(0).toUpperCase()}${slot.slice(1)}`,
      protein_g: Math.max(0, finite(plan.protein_g, 0)),
      carbs_g: Math.max(0, finite(plan.carbs_g, 0)),
      fat_g: Math.max(0, finite(plan.fat_g, 0)),
      serving_size: clean(plan.serving_size, 220) || "From today's Meal Plan"
    };

    const { data, error } = await client.rpc("ari_consume_nutrition_plan", { p_plan_id: plan.id, p_mutation_id: mutationId, p_consumed: consumed, p_remaining: null });
    if (error) return failure("planned_meal_transaction_failed", error.message || "That planned meal could not be logged. Nothing was changed.");

    const after = await sync.loadToday();
    if ((Array.isArray(after) ? after : []).some((item) => clean(item?.id, 180) === clean(plan.id, 180) && clean(item?.status || "planned", 40) === "planned")) {
      return failure("planned_meal_transaction_not_verified", "The planned meal was not removed from the active plan after logging, so Ari will not claim it was completed.");
    }

    await refreshMealPlan("planned_meal_eaten", { planId: plan.id, mutationId: data?.mutationId || mutationId });
    return { success: true, result: { ...(data || {}), meal: { id: data?.mealId || null, ...consumed }, mutationId: data?.mutationId || mutationId }, reply: `${consumed.name} is logged as eaten.` };
  }

  function registerCorePrepare(registry) {
    const adapter = window.AriVNextActionAdapter;
    const nutrition = window.AriVNextNutritionResolutionAdapter;
    const activity = window.AriVNextActivityAdapter;

    registry.registerOperation("log_meal", {
      source: `${SOURCE}:core`, priority: 10000,
      match(pending = {}) { return Array.isArray(pending?.arguments?.items); },
      async prepare(pending = {}) { return await nutrition.resolveMeal(pending); },
      async createPending(pending = {}) { return await createStoredPending(pending); },
      async executeConfirmed(input = {}) { return await executePreparedApplication(input); }
    });

    registry.registerOperation("log_activity", {
      source: `${SOURCE}:core`, priority: 10000,
      async prepare(pending = {}) { return await activity.prepare(pending, object(pending?.arguments)); },
      async createPending(pending = {}) { return await createStoredPending(pending); },
      async executeConfirmed(input = {}) { return await executePreparedApplication(input); }
    });

    registry.registerOperation("log_weight", {
      source: `${SOURCE}:core`, priority: 10000,
      async prepare(pending = {}) { return adapter.mapWeight(pending, object(pending?.arguments)); },
      async createPending(pending = {}) { return await createStoredPending(pending); },
      async executeConfirmed(input = {}) { return await executePreparedApplication(input); }
    });

    registry.registerOperation("update_goal", {
      source: `${SOURCE}:core`, priority: 10000,
      async prepare(pending = {}) { return adapter.mapGoal(pending, object(pending?.arguments)); },
      async createPending(pending = {}) { return await createStoredPending(pending); },
      async executeConfirmed(input = {}) { return await executePreparedApplication(input); }
    });

    for (const name of ["plan_meal", "log_planned_meal", ...CIRCLE_OPERATIONS]) {
      registry.registerOperation(name, {
        source: `${SOURCE}:registry-execution`, priority: 10000,
        async createPending(pending = {}) { return await createStoredPending(pending); },
        async executeConfirmed(input = {}) { return await executePreparedApplication(input); }
      });
    }

    for (const name of SPECIAL_WORKOUT_OPERATIONS) {
      registry.registerOperation(name, {
        source: `${SOURCE}:workout`, priority: 10000,
        async prepare(pending = {}) {
          return name === "plan_workout"
            ? await adapter.mapWorkoutPlanValidated(pending, object(pending?.arguments))
            : await adapter.mapWorkoutEditValidated(pending, object(pending?.arguments));
        },
        async createPending(pending = {}) { return await createStoredPending(pending); },
        async executeConfirmed(input = {}) { return await executeWorkout(input); }
      });
    }
  }

  function registerCoreApplicationExecutors(registry) {
    registry.registerApplicationExecutor("log_meal", { source: `${SOURCE}:nutrition-ledger`, priority: 10000, match(action = {}) { return action?.payload?.vnext_resolved_nutrition === true; }, async execute(action = {}) { return await executeResolvedMeal(action); } });
    registry.registerApplicationExecutor("log_weight", { source: `${SOURCE}:weight`, priority: 10000, async execute(action = {}) { return await executeWeight(action); } });
    registry.registerApplicationExecutor("update_goal_profile", { source: `${SOURCE}:goals`, priority: 10000, async execute(action = {}) { return await executeGoal(action); } });
    registry.registerApplicationExecutor("plan_meal", { source: `${SOURCE}:meal-plan`, priority: 10000, async execute(action = {}) { return await executePlanMeal(action); } });
    registry.registerApplicationExecutor("log_planned_meal", { source: `${SOURCE}:meal-plan`, priority: 10000, async execute(action = {}) { return await executeLogPlannedMeal(action); } });
  }

  function install() {
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || registry[INSTALL_FLAG]) return Boolean(registry?.[INSTALL_FLAG]);
    if (!window.AriVNextOperationRegistryPhase8B?.ready) return false;
    if (!window.AriVNextNutritionResolutionAdapter?.ready || !window.AriVNextActivityAdapter || !window.AriVNextActionAdapter) return false;

    registerCorePrepare(registry);
    registerCoreApplicationExecutors(registry);

    const snapshot = registry.snapshot();
    const missingOperations = MODEL_MUTATION_OPERATIONS.filter((name) => !snapshot.operationNames.includes(name));
    const requiredApplicationActions = [
      "log_meal", "log_activity", "log_weight", "update_goal_profile", "plan_meal", "log_planned_meal",
      "circle_create_meetup", "circle_join_meetup", "circle_leave_meetup", "circle_cancel_meetup",
      "circle_create_mission", "circle_join_mission", "circle_submit_mission_progress",
      "circle_create_crew", "circle_accept_crew_invite", "circle_decline_crew_invite", "circle_leave_crew", "circle_archive_crew"
    ];
    const missingApplicationActions = requiredApplicationActions.filter((name) => !snapshot.applicationActionTypes.includes(name));
    if (missingOperations.length || missingApplicationActions.length) {
      throw new Error(`Phase 8C registry coverage incomplete: operations=${missingOperations.join(",") || "none"}; application=${missingApplicationActions.join(",") || "none"}`);
    }

    Object.defineProperty(registry, INSTALL_FLAG, { configurable: false, enumerable: false, value: VERSION });
    window.AriVNextOperationRegistryPhase8C = Object.freeze({
      version: VERSION,
      source: SOURCE,
      ready: true,
      fallbackPolicy: "no_model_visible_mutation_requires_captured_fallback",
      modelMutationOperations: [...MODEL_MUTATION_OPERATIONS].sort(),
      requiredApplicationActions: [...requiredApplicationActions].sort()
    });
    window.dispatchEvent(new CustomEvent("ari:vnextOperationRegistryPhase8CReady", { detail: { version: VERSION, operationCount: MODEL_MUTATION_OPERATIONS.length } }));
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    try {
      if (install()) {
        window.clearInterval(timer);
        return;
      }
    } catch (error) {
      console.error("[Ari Phase 8C] final registry cutover failed:", error?.message || error);
      window.clearInterval(timer);
      return;
    }
    if (attempts >= 300) window.clearInterval(timer);
  }, 25);
})();
