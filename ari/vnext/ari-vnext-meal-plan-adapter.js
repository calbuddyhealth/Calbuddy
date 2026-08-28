// ARI vNext — permanent Meal Plan registry adapter.
// Validates today-only plan proposals and owns their registry lifecycle without patching AriVNextActionAdapter.

(() => {
  "use strict";

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "2.0.0";
  const SOURCE = "ari_vnext_meal_plan_adapter";
  let installed = false;
  let planServicePromise = null;

  function clean(value = "", max = 500) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function round1(value) {
    return Math.round(Math.max(0, finite(value) ?? 0) * 10) / 10;
  }

  function todayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function normalizeSlot(value = "") {
    const text = clean(value, 40).toLowerCase();
    return ["breakfast", "lunch", "dinner", "snack"].includes(text) ? text : "";
  }

  function slotLabel(slot = "") {
    const value = normalizeSlot(slot);
    return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "Meal";
  }

  function failure(code, message, extra = {}) {
    return { success: false, code, message, ...extra };
  }

  function normalizeComponent(item = {}, index = 0) {
    const name = clean(item?.name, 180);
    const calories = finite(item?.calories);
    const protein = finite(item?.proteinG ?? item?.protein_g);
    const carbs = finite(item?.carbsG ?? item?.carbs_g);
    const fat = finite(item?.fatG ?? item?.fat_g);
    if (!name || [calories, protein, carbs, fat].some((value) => value === null || value < 0)) return null;
    return {
      id: clean(item?.id, 160) || `component-${index}`,
      name,
      amount: clean(item?.amount ?? item?.servingSize ?? item?.serving_size, 180),
      calories: Math.round(calories),
      protein_g: round1(protein),
      carbs_g: round1(carbs),
      fat_g: round1(fat)
    };
  }

  function normalizeMeal(meal = {}, index = 0) {
    const mealSlot = normalizeSlot(meal?.mealSlot ?? meal?.meal_slot);
    const name = clean(meal?.name, 180);
    const calories = finite(meal?.calories);
    const protein = finite(meal?.proteinG ?? meal?.protein_g);
    const carbs = finite(meal?.carbsG ?? meal?.carbs_g);
    const fat = finite(meal?.fatG ?? meal?.fat_g);
    if (!mealSlot || !name || [calories, protein, carbs, fat].some((value) => value === null || value < 0) || calories <= 0 || calories > 5000) return null;

    let items = (Array.isArray(meal?.items) ? meal.items : []).slice(0, 16).map(normalizeComponent).filter(Boolean);
    if (!items.length) {
      items = [{ id: `whole-meal-${index}`, name, amount: clean(meal?.servingSize ?? meal?.serving_size, 180) || "1 planned serving", calories: Math.round(calories), protein_g: round1(protein), carbs_g: round1(carbs), fat_g: round1(fat) }];
    }

    return {
      plan_date: todayKey(),
      meal_slot: mealSlot,
      name,
      calories: Math.round(calories),
      protein_g: round1(protein),
      carbs_g: round1(carbs),
      fat_g: round1(fat),
      serving_size: clean(meal?.servingSize ?? meal?.serving_size, 220) || "Planned by Ari",
      items,
      notes: clean(meal?.notes, 500)
    };
  }

  async function mapPlan(pending = {}) {
    const args = pending?.arguments && typeof pending.arguments === "object" ? pending.arguments : {};
    const sourceMeals = Array.isArray(args?.meals) ? args.meals.slice(0, 4) : [];
    const meals = sourceMeals.map(normalizeMeal).filter(Boolean);
    if (!meals.length || meals.length !== sourceMeals.length) return failure("meal_plan_required", "Ari did not produce a complete valid meal for today’s Meal Plan.");

    const slots = meals.map((meal) => meal.meal_slot);
    if (new Set(slots).size !== slots.length) return failure("meal_plan_duplicate_slots", "Ari proposed more than one meal for the same Meal Plan slot.");

    const budgetBasis = clean(args?.budgetBasis, 60).toLowerCase() || "general";
    const targetCalories = finite(args?.targetCalories);
    const context = typeof window.CalBuddy?.getUserContext === "function" ? await window.CalBuddy.getUserContext() : {};
    if (budgetBasis === "daily_goal" && finite(context?.dailyGoal) === null) return failure("daily_calorie_goal_required", "Your Daily Calorie Goal is not set, so Ari will not invent a calorie budget. Set the goal first or give Ari an explicit calorie target.");
    if (budgetBasis === "explicit_user_target" && (targetCalories === null || targetCalories <= 0)) return failure("explicit_meal_plan_target_required", "The requested Meal Plan calorie target is missing.");

    const activeSlots = new Set((Array.isArray(context?.plannedMeals) ? context.plannedMeals : []).map((item) => normalizeSlot(item?.meal_slot ?? item?.mealSlot)).filter(Boolean));
    const collision = meals.find((meal) => activeSlots.has(meal.meal_slot));
    if (collision) return failure("meal_plan_slot_already_active", `Today’s ${slotLabel(collision.meal_slot).toLowerCase()} already has an active Meal Plan. Discard it before replacing it.`);

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const remaining = finite(context?.caloriesRemainingAfterPlan);
    if (budgetBasis === "daily_goal" && remaining !== null && totalCalories > remaining + Math.max(100, Math.round(remaining * 0.10))) {
      return failure("meal_plan_exceeds_remaining_budget", "That plan is above the calories remaining in today’s saved budget, so Ari will not save it as-is.", { proposedCalories: totalCalories, remainingCalories: remaining });
    }

    return {
      success: true,
      action: {
        action_type: "plan_meal",
        payload: { meals, plan_date: todayKey(), source: SOURCE, requested_from_message: clean(pending?.sourceMessage, 800), vnext_action_id: clean(pending?.id, 180) },
        confirmation_text: meals.length === 1 ? `Add ${meals[0].name} — about ${meals[0].calories} kcal — to today’s ${slotLabel(meals[0].meal_slot).toLowerCase()} Meal Plan?` : `Add this ${Math.round(totalCalories).toLocaleString()} kcal plan to today’s Meal Plan?`
      },
      resolution: { todayOnly: true, budgetBasis, targetCalories: targetCalories === null ? null : Math.round(targetCalories), totalCalories: Math.round(totalCalories), mealSlots: slots }
    };
  }

  async function mapLogPlannedMeal(pending = {}) {
    const args = pending?.arguments && typeof pending.arguments === "object" ? pending.arguments : {};
    const mealSlot = normalizeSlot(args?.mealSlot ?? args?.meal_slot);
    if (!mealSlot) return failure("planned_meal_slot_required", "Choose breakfast, lunch, dinner, or snack from today’s Meal Plan.");
    return {
      success: true,
      action: { action_type: "log_planned_meal", payload: { meal_slot: mealSlot, source: SOURCE, requested_from_message: clean(pending?.sourceMessage, 800), vnext_action_id: clean(pending?.id, 180) }, confirmation_text: `Log today’s planned ${slotLabel(mealSlot).toLowerCase()} as eaten?` },
      resolution: { todayOnly: true, mealSlot }
    };
  }

  async function storePending(pending = {}, prepared = {}) {
    if (!prepared?.success || !prepared?.action) return prepared;
    if (typeof window.CalBuddy?.createPendingAction !== "function") return failure("pending_action_service_unavailable", "Ari could not prepare that Meal Plan change safely.");
    const stored = await window.CalBuddy.createPendingAction(prepared.action);
    const wrapped = { ...stored, vnext_action_id: pending.id, vnext_source_turn_id: pending.sourceTurnId, vnext_expires_at: pending.expiresAt || null, vnext_source: SOURCE };
    window.CalBuddy.setPendingAction?.(wrapped);
    return { success: true, action: wrapped, resolution: prepared.resolution || null };
  }

  async function planService() {
    if (!planServicePromise) planServicePromise = import("../../js/nutrition/nutrition-plan-service.js?v=1.0.0").then((module) => module.default || module.NutritionPlanService);
    return planServicePromise;
  }

  async function refresh(action, detail = {}) {
    try { await window.AriNutritionPage?.refresh?.(); } catch {}
    try { await window.CalBuddy?.getConsumedCalories?.(); } catch {}
    try {
      window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", { detail: { action, source: SOURCE, version: VERSION, ...detail } }));
      window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", { detail: { action, source: SOURCE, ...detail } }));
    } catch {}
  }

  async function executePlan(input = {}) {
    const pending = input?.vnextPendingAction || input || {};
    const prepared = await mapPlan(pending);
    if (!prepared?.success) return prepared;
    const sync = window.AriNutritionPlanSync;
    if (!sync?.pushRecords || !sync?.loadToday) return failure("meal_plan_sync_unavailable", "Today’s Meal Plan service is not ready right now.");
    try {
      const records = prepared.action.payload.meals.map((meal) => ({ ...meal, status: "planned", updated_at: new Date().toISOString() }));
      const written = await sync.pushRecords(records);
      const current = await sync.loadToday();
      const expected = new Set(records.map((meal) => meal.meal_slot));
      const verified = (Array.isArray(current) ? current : []).filter((meal) => expected.has(normalizeSlot(meal?.meal_slot)) && clean(meal?.status || "planned", 40) === "planned");
      if (verified.length < expected.size) return failure("meal_plan_write_not_verified", "Ari could not verify every planned meal after saving, so the plan was not reported as complete.");
      await refresh("plan_created", { mealSlots: [...expected] });
      return { success: true, result: { meals: verified, written }, action: { ...prepared.action, vnext_action_id: pending.id, vnext_source_turn_id: pending.sourceTurnId, vnext_confirmation_turn_id: clean(input?.currentTurnId, 200) || null, vnext_source: SOURCE }, reply: verified.length === 1 ? `${verified[0].name || "Meal"} added to today’s Meal Plan.` : "Today’s Meal Plan was updated." };
    } catch (error) {
      return failure("meal_plan_write_failed", error?.message || "Today’s Meal Plan could not be saved.");
    }
  }

  async function executeLogPlanned(input = {}) {
    const pending = input?.vnextPendingAction || input || {};
    const prepared = await mapLogPlannedMeal(pending);
    if (!prepared?.success) return prepared;
    const slot = normalizeSlot(prepared.action?.payload?.meal_slot);
    const sync = window.AriNutritionPlanSync;
    if (!sync?.loadToday) return failure("meal_plan_sync_unavailable", "Today’s Meal Plan service is not ready right now.");
    const current = await sync.loadToday();
    const matches = (Array.isArray(current) ? current : []).filter((plan) => normalizeSlot(plan?.meal_slot) === slot && clean(plan?.status || "planned", 40) === "planned");
    if (matches.length !== 1 || !clean(matches[0]?.id, 180)) return failure("planned_meal_target_ambiguous", `Ari could not resolve exactly one active ${slot} plan.`);
    const service = await planService();
    const result = await service.consumePlan({ action: pending, plan: matches[0], selectedIndexes: null });
    if (!result?.success) return result;
    return { ...result, action: { ...prepared.action, vnext_action_id: pending.id, vnext_source_turn_id: pending.sourceTurnId, vnext_confirmation_turn_id: clean(input?.currentTurnId, 200) || null, vnext_source: SOURCE } };
  }

  function register() {
    if (installed) return true;
    const registry = window.AriVNextOperationRegistry;
    if (!registry?.ready || typeof registry.registerOperation !== "function") return false;
    registry.registerOperation("plan_meal", { source: SOURCE, priority: 23000, prepare: mapPlan, async createPending(pending = {}) { return await storePending(pending, await mapPlan(pending)); }, executeConfirmed: executePlan });
    registry.registerOperation("log_planned_meal", { source: SOURCE, priority: 23000, prepare: mapLogPlannedMeal, async createPending(pending = {}) { return await storePending(pending, await mapLogPlannedMeal(pending)); }, executeConfirmed: executeLogPlanned });
    installed = true;
    return true;
  }

  window.AriVNextMealPlanAdapter = Object.freeze({ version: VERSION, source: SOURCE, ready: true, mapPlan, mapLogPlannedMeal, executePlan, executeLogPlanned });
  if (!register()) window.addEventListener("ari:vnextOperationRegistryReady", register, { once: true });
  window.dispatchEvent(new CustomEvent("ari:vnextMealPlanAdapterReady", { detail: { version: VERSION, source: SOURCE } }));
})();
