// =====================================================
// ARI XP — vNext Meal Plan trusted adapter
// Version: 1.0.1
// Purpose:
//   Translate vNext Meal Plan proposals into the existing today-only
//   Nutrition Meal Plan executor. GPT decides what the user means; this layer
//   validates the mutation contract before anything is stored.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.1";
  const SOURCE = "ari_vnext_meal_plan_adapter";
  const INSTALL_FLAG = "__ariVNextMealPlanAdapterV1";
  const EXECUTOR_SCRIPT_ID = "ariVNextMealPlanExecutorV2";

  window.AriVNextMealPlanAdapter = {
    version: VERSION,
    source: SOURCE,
    ready: false
  };

  function clean(value = "") {
    return String(value ?? "").trim();
  }

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function round1(value) {
    const number = Math.max(0, finite(value) ?? 0);
    return Math.round(number * 10) / 10;
  }

  function todayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function normalizeSlot(value = "") {
    const text = clean(value).toLowerCase();
    if (text === "breakfast") return "breakfast";
    if (text === "lunch") return "lunch";
    if (text === "dinner") return "dinner";
    if (text === "snack") return "snack";
    return "";
  }

  function slotLabel(slot = "") {
    const value = normalizeSlot(slot);
    return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Meal";
  }

  function normalizeComponent(item = {}, index = 0) {
    const name = clean(item?.name);
    const calories = finite(item?.calories);
    const protein = finite(item?.proteinG ?? item?.protein_g);
    const carbs = finite(item?.carbsG ?? item?.carbs_g);
    const fat = finite(item?.fatG ?? item?.fat_g);

    if (!name || calories === null || protein === null || carbs === null || fat === null) return null;
    if ([calories, protein, carbs, fat].some((value) => value < 0)) return null;

    return {
      id: clean(item?.id) || `component-${index}`,
      name,
      amount: clean(item?.amount || item?.servingSize || item?.serving_size),
      calories: Math.round(calories),
      protein_g: round1(protein),
      carbs_g: round1(carbs),
      fat_g: round1(fat)
    };
  }

  function normalizeMeal(meal = {}, index = 0) {
    const mealSlot = normalizeSlot(meal?.mealSlot ?? meal?.meal_slot);
    const name = clean(meal?.name);
    const calories = finite(meal?.calories);
    const protein = finite(meal?.proteinG ?? meal?.protein_g);
    const carbs = finite(meal?.carbsG ?? meal?.carbs_g);
    const fat = finite(meal?.fatG ?? meal?.fat_g);

    if (!mealSlot || !name) return null;
    if ([calories, protein, carbs, fat].some((value) => value === null || value < 0)) return null;
    if (calories <= 0 || calories > 5000) return null;

    let items = (Array.isArray(meal?.items) ? meal.items : [])
      .map(normalizeComponent)
      .filter(Boolean);

    if (!items.length) {
      items = [{
        id: `whole-meal-${index}`,
        name,
        amount: clean(meal?.servingSize ?? meal?.serving_size) || "1 planned serving",
        calories: Math.round(calories),
        protein_g: round1(protein),
        carbs_g: round1(carbs),
        fat_g: round1(fat)
      }];
    }

    return {
      plan_date: todayKey(),
      meal_slot: mealSlot,
      name,
      calories: Math.round(calories),
      protein_g: round1(protein),
      carbs_g: round1(carbs),
      fat_g: round1(fat),
      serving_size: clean(meal?.servingSize ?? meal?.serving_size) || "Planned by Ari",
      items,
      notes: clean(meal?.notes)
    };
  }

  function failure(code, message, extra = {}) {
    return {
      success: false,
      code,
      message,
      ...extra
    };
  }

  function ensureExecutorScript() {
    if (window.CalBuddy?.__ariMealPlanActionV2) return;
    if (document.getElementById(EXECUTOR_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = EXECUTOR_SCRIPT_ID;
    script.src = "ari/actions/ari-meal-plan-action-v2.js?v=2.0.0";
    script.async = false;
    document.head.appendChild(script);
  }

  async function waitForExecutor() {
    ensureExecutorScript();
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (window.CalBuddy?.__ariMealPlanActionV2) return true;
      await new Promise((resolve) => window.setTimeout(resolve, 40));
    }
    return false;
  }

  async function mapPlan(pending = {}) {
    const args = pending?.arguments && typeof pending.arguments === "object"
      ? pending.arguments
      : {};
    const meals = (Array.isArray(args?.meals) ? args.meals : [])
      .slice(0, 4)
      .map(normalizeMeal)
      .filter(Boolean);

    if (!meals.length) {
      return failure("meal_plan_required", "Ari did not produce a complete meal for today’s Meal Plan.");
    }

    const slots = meals.map((meal) => meal.meal_slot);
    if (new Set(slots).size !== slots.length) {
      return failure("meal_plan_duplicate_slots", "Ari proposed more than one meal for the same Meal Plan slot.");
    }

    const budgetBasis = clean(args?.budgetBasis).toLowerCase() || "general";
    const targetCalories = finite(args?.targetCalories);
    const context = typeof window.CalBuddy?.getUserContext === "function"
      ? await window.CalBuddy.getUserContext()
      : {};

    if (budgetBasis === "daily_goal" && finite(context?.dailyGoal) === null) {
      return failure(
        "daily_calorie_goal_required",
        "Your Daily Calorie Goal is not set, so Ari will not invent a calorie budget. Set the goal first or give Ari an explicit calorie target."
      );
    }

    if (budgetBasis === "explicit_user_target" && (targetCalories === null || targetCalories <= 0)) {
      return failure("explicit_meal_plan_target_required", "The requested Meal Plan calorie target is missing.");
    }

    const activeSlots = new Set(
      (Array.isArray(context?.plannedMeals) ? context.plannedMeals : [])
        .map((item) => normalizeSlot(item?.meal_slot ?? item?.mealSlot))
        .filter(Boolean)
    );
    const collision = meals.find((meal) => activeSlots.has(meal.meal_slot));
    if (collision) {
      return failure(
        "meal_plan_slot_already_active",
        `Today’s ${slotLabel(collision.meal_slot).toLowerCase()} already has an active Meal Plan. Discard it before replacing it.`
      );
    }

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const remaining = finite(context?.caloriesRemainingAfterPlan);
    if (
      budgetBasis === "daily_goal" &&
      remaining !== null &&
      totalCalories > remaining + Math.max(100, Math.round(remaining * 0.10))
    ) {
      return failure(
        "meal_plan_exceeds_remaining_budget",
        "That plan is above the calories remaining in today’s saved budget, so Ari will not save it as-is.",
        { proposedCalories: totalCalories, remainingCalories: remaining }
      );
    }

    const executorReady = await waitForExecutor();
    if (!executorReady) {
      return failure("meal_plan_executor_unavailable", "Today’s Meal Plan service is not ready yet.");
    }

    const confirmation = meals.length === 1
      ? `Add ${meals[0].name} — about ${meals[0].calories} kcal — to today’s ${slotLabel(meals[0].meal_slot).toLowerCase()} Meal Plan?`
      : `Add this ${Math.round(totalCalories).toLocaleString()} kcal plan to today’s Meal Plan?`;

    return {
      success: true,
      action: {
        action_type: "plan_meal",
        payload: {
          meals,
          plan_date: todayKey(),
          source: SOURCE,
          requested_from_message: clean(pending?.sourceMessage),
          vnext_action_id: clean(pending?.id)
        },
        confirmation_text: confirmation
      },
      resolution: {
        todayOnly: true,
        budgetBasis,
        targetCalories: targetCalories === null ? null : Math.round(targetCalories),
        totalCalories: Math.round(totalCalories),
        mealSlots: slots
      }
    };
  }

  async function mapLogPlannedMeal(pending = {}) {
    const args = pending?.arguments && typeof pending.arguments === "object"
      ? pending.arguments
      : {};
    const mealSlot = normalizeSlot(args?.mealSlot ?? args?.meal_slot);
    if (!mealSlot) {
      return failure("planned_meal_slot_required", "Choose breakfast, lunch, dinner, or snack from today’s Meal Plan.");
    }

    const executorReady = await waitForExecutor();
    if (!executorReady) {
      return failure("meal_plan_executor_unavailable", "Today’s Meal Plan service is not ready yet.");
    }

    return {
      success: true,
      action: {
        action_type: "log_planned_meal",
        payload: {
          meal_slot: mealSlot,
          source: SOURCE,
          requested_from_message: clean(pending?.sourceMessage),
          vnext_action_id: clean(pending?.id)
        },
        confirmation_text: `Log today’s planned ${slotLabel(mealSlot).toLowerCase()} as eaten?`
      },
      resolution: {
        todayOnly: true,
        mealSlot
      }
    };
  }

  function install() {
    const adapter = window.AriVNextActionAdapter;
    if (!adapter || adapter[INSTALL_FLAG]) {
      const ready = Boolean(adapter?.[INSTALL_FLAG]);
      window.AriVNextMealPlanAdapter.ready = ready;
      return ready;
    }
    if (typeof adapter.prepareCalBuddyAction !== "function") return false;

    const originalPrepare = adapter.prepareCalBuddyAction.bind(adapter);

    adapter.prepareCalBuddyAction = async function ariVNextMealPlanPrepare(pendingAction = {}) {
      const name = clean(pendingAction?.name);
      if (name === "plan_meal") return await mapPlan(pendingAction);
      if (name === "log_planned_meal") return await mapLogPlannedMeal(pendingAction);
      return await originalPrepare(pendingAction);
    };

    Object.defineProperty(adapter, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    window.AriVNextMealPlanAdapter.ready = true;
    window.dispatchEvent(new CustomEvent("ari:vnextMealPlanAdapterReady", {
      detail: { version: VERSION, source: SOURCE }
    }));
    console.log("ARI vNext Meal Plan adapter installed:", VERSION);
    return true;
  }

  ensureExecutorScript();

  if (!install()) {
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 300) window.clearInterval(timer);
    }, 40);
  }
})();