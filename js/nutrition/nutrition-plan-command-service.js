// Canonical Meal Plan command boundary for plan creation and slot consumption.
// Keeps Ari registry adapters free of Nutrition business rules and persistence.

const SOURCE = "nutrition_plan_command_service";

const clean = (value = "", max = 240) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const array = (value) => Array.isArray(value) ? value : [];
const finite = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const round1 = (value) => Math.round(Math.max(0, finite(value) ?? 0) * 10) / 10;
const failure = (code, message, extra = {}) => ({ success: false, code, message, ...extra });

function normalizeSlot(value = "") {
  const slot = clean(value, 40).toLowerCase();
  return ["breakfast", "lunch", "dinner", "snack"].includes(slot) ? slot : "";
}

function slotLabel(value = "") {
  const slot = normalizeSlot(value);
  return slot ? `${slot.charAt(0).toUpperCase()}${slot.slice(1)}` : "Meal";
}

function normalizeMealComponent(item = {}, index = 0) {
  const name = clean(item?.name, 180);
  const calories = finite(item?.calories);
  const protein = finite(item?.proteinG ?? item?.protein_g);
  const carbs = finite(item?.carbsG ?? item?.carbs_g);
  const fat = finite(item?.fatG ?? item?.fat_g);
  if (!name || [calories, protein, carbs, fat].some((value) => value === null || value < 0)) return null;
  return {
    id: clean(item?.id, 160) || `component-${index}`,
    name,
    amount: clean(item?.amount || item?.servingSize || item?.serving_size, 180),
    calories: Math.round(calories),
    protein_g: round1(protein),
    carbs_g: round1(carbs),
    fat_g: round1(fat)
  };
}

function normalizePlannedMeal(meal = {}, index = 0) {
  const mealSlot = normalizeSlot(meal?.mealSlot ?? meal?.meal_slot);
  const name = clean(meal?.name, 180);
  const calories = finite(meal?.calories);
  const protein = finite(meal?.proteinG ?? meal?.protein_g);
  const carbs = finite(meal?.carbsG ?? meal?.carbs_g);
  const fat = finite(meal?.fatG ?? meal?.fat_g);
  if (!mealSlot || !name || [calories, protein, carbs, fat].some((value) => value === null || value < 0) || calories <= 0 || calories > 5000) return null;
  let items = array(meal?.items).map(normalizeMealComponent).filter(Boolean);
  if (!items.length) {
    items = [{
      id: `whole-meal-${index}`,
      name,
      amount: clean(meal?.servingSize ?? meal?.serving_size, 180) || "1 planned serving",
      calories: Math.round(calories),
      protein_g: round1(protein),
      carbs_g: round1(carbs),
      fat_g: round1(fat)
    }];
  }
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return {
    plan_date: date,
    meal_slot: mealSlot,
    name,
    calories: Math.round(calories),
    protein_g: round1(protein),
    carbs_g: round1(carbs),
    fat_g: round1(fat),
    serving_size: clean(meal?.servingSize ?? meal?.serving_size, 180) || "Planned by Ari",
    items,
    notes: clean(meal?.notes, 500)
  };
}

export async function preparePlan(pending = {}) {
  const args = pending?.arguments && typeof pending.arguments === "object" ? pending.arguments : {};
  const meals = array(args?.meals).slice(0, 4).map(normalizePlannedMeal).filter(Boolean);
  if (!meals.length) return failure("meal_plan_required", "Ari did not produce a complete meal for today’s Meal Plan.");
  const slots = meals.map((meal) => meal.meal_slot);
  if (new Set(slots).size !== slots.length) return failure("meal_plan_duplicate_slots", "Ari proposed more than one meal for the same Meal Plan slot.");

  const context = typeof window?.CalBuddy?.getUserContext === "function" ? await window.CalBuddy.getUserContext() : {};
  const budgetBasis = clean(args?.budgetBasis, 40).toLowerCase() || "general";
  const targetCalories = finite(args?.targetCalories);
  if (budgetBasis === "daily_goal" && finite(context?.dailyGoal) === null) {
    return failure("daily_calorie_goal_required", "Your Daily Calorie Goal is not set, so Ari will not invent a calorie budget. Set the goal first or give Ari an explicit calorie target.");
  }
  if (budgetBasis === "explicit_user_target" && (targetCalories === null || targetCalories <= 0)) {
    return failure("explicit_meal_plan_target_required", "The requested Meal Plan calorie target is missing.");
  }

  const activeSlots = new Set(array(context?.plannedMeals).map((item) => normalizeSlot(item?.meal_slot ?? item?.mealSlot)).filter(Boolean));
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
      payload: { meals, plan_date: meals[0].plan_date, source: SOURCE, requested_from_message: clean(pending?.sourceMessage, 600), vnext_action_id: clean(pending?.id, 180) },
      confirmation_text: meals.length === 1
        ? `Add ${meals[0].name} — about ${meals[0].calories} kcal — to today’s ${slotLabel(meals[0].meal_slot).toLowerCase()} Meal Plan?`
        : `Add this ${Math.round(totalCalories).toLocaleString()} kcal plan to today’s Meal Plan?`
    },
    resolution: { todayOnly: true, budgetBasis, targetCalories: targetCalories === null ? null : Math.round(targetCalories), totalCalories: Math.round(totalCalories), mealSlots: slots }
  };
}

export function preparePlannedMealLog(pending = {}) {
  const mealSlot = normalizeSlot(pending?.arguments?.mealSlot ?? pending?.arguments?.meal_slot);
  if (!mealSlot) return failure("planned_meal_slot_required", "Choose breakfast, lunch, dinner, or snack from today’s Meal Plan.");
  return {
    success: true,
    action: {
      action_type: "log_planned_meal",
      payload: { meal_slot: mealSlot, source: SOURCE, requested_from_message: clean(pending?.sourceMessage, 600), vnext_action_id: clean(pending?.id, 180) },
      confirmation_text: `Log today’s planned ${slotLabel(mealSlot).toLowerCase()} as eaten?`
    },
    resolution: { todayOnly: true, mealSlot }
  };
}

async function refresh(action, detail = {}) {
  try { await window?.AriNutritionPage?.refresh?.(); } catch {}
  try { await window?.CalBuddy?.getConsumedCalories?.(); } catch {}
  try {
    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", { detail: { action, source: SOURCE, ...detail } }));
    window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", { detail: { action, source: SOURCE, ...detail } }));
  } catch {}
}

export async function savePlan(action = {}) {
  const sync = window?.AriNutritionPlanSync;
  const meals = array(action?.payload?.meals).slice(0, 4);
  if (!sync?.pushRecords || !sync?.loadToday || !meals.length) return failure("meal_plan_executor_unavailable", "Today's trusted Meal Plan service is unavailable.");
  try {
    const written = await sync.pushRecords(meals.map((meal) => ({ ...meal, status: "planned", updated_at: new Date().toISOString() })));
    const current = await sync.loadToday();
    const expected = new Set(meals.map((meal) => clean(meal?.meal_slot, 40)));
    const verified = array(current).filter((meal) => expected.has(clean(meal?.meal_slot, 40)));
    if (verified.length < expected.size) return failure("meal_plan_write_not_verified", "Ari could not verify every planned meal after saving, so the plan was not reported as complete.");
    await refresh("plan_created", { mealSlots: [...expected] });
    return { success: true, result: { meals: verified, written }, reply: verified.length === 1 ? `${verified[0].name || "Meal"} added to today's Meal Plan.` : "Today's Meal Plan was updated." };
  } catch (error) {
    return failure("meal_plan_write_failed", error?.message || "Today's Meal Plan could not be saved.");
  }
}

export async function logPlannedMeal(action = {}) {
  const sync = window?.AriNutritionPlanSync;
  const client = window?.calbuddySupabase;
  const slot = normalizeSlot(action?.payload?.meal_slot);
  if (!sync?.loadToday || typeof client?.rpc !== "function" || !slot) return failure("planned_meal_executor_unavailable", "Today's planned meal could not be resolved safely.");

  const current = await sync.loadToday();
  const matches = array(current).filter((plan) => normalizeSlot(plan?.meal_slot) === slot && clean(plan?.status || "planned", 40) === "planned");
  if (matches.length !== 1 || !clean(matches[0]?.id, 180)) return failure("planned_meal_target_ambiguous", `Ari could not resolve exactly one active ${slot} plan.`);
  const plan = matches[0];
  const mutationId = globalThis.crypto?.randomUUID?.() || `00000000-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12)}`;
  const consumed = {
    name: clean(plan?.name, 180) || "Meal",
    calories: Math.max(1, Math.round(finite(plan?.calories) ?? 0)),
    category: slotLabel(slot),
    protein_g: Math.max(0, finite(plan?.protein_g) ?? 0),
    carbs_g: Math.max(0, finite(plan?.carbs_g) ?? 0),
    fat_g: Math.max(0, finite(plan?.fat_g) ?? 0),
    serving_size: clean(plan?.serving_size, 220) || "From today's Meal Plan"
  };

  const { data, error } = await client.rpc("ari_consume_nutrition_plan", { p_plan_id: plan.id, p_mutation_id: mutationId, p_consumed: consumed, p_remaining: null });
  if (error) return failure("planned_meal_transaction_failed", error.message || "That planned meal could not be logged. Nothing was changed.");

  const after = await sync.loadToday();
  if (array(after).some((item) => clean(item?.id, 180) === clean(plan.id, 180) && clean(item?.status || "planned", 40) === "planned")) {
    return failure("planned_meal_transaction_not_verified", "The planned meal was not removed from the active plan after logging, so Ari will not claim it was completed.");
  }
  await refresh("planned_meal_eaten", { planId: clean(plan.id, 180), mutationId: clean(data?.mutationId || mutationId, 80) });
  return { success: true, result: { ...(data || {}), meal: consumed, mutationId: data?.mutationId || mutationId }, reply: `${consumed.name} is logged as eaten.` };
}

export const NutritionPlanCommandService = Object.freeze({ preparePlan, preparePlannedMealLog, savePlan, logPlannedMeal });
export default NutritionPlanCommandService;
