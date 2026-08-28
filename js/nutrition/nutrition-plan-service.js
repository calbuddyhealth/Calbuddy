// Canonical Nutrition Meal Plan mutation service.
// Reference resolution stays outside; all Meal Plan writes and verification live here.

const MUTATION_PREFIX = "ari_vnext_plan_mutation_v3:";

function clean(value = "", max = 240) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function finite(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round1(value) {
  return Math.round(Math.max(0, finite(value) ?? 0) * 10) / 10;
}

function failure(code, message) {
  return { success: false, code, message };
}

function normalizeSlot(value = "") {
  const slot = clean(value, 40).toLowerCase();
  return ["breakfast", "lunch", "dinner", "snack"].includes(slot) ? slot : "";
}

function slotLabel(value = "") {
  const slot = normalizeSlot(value);
  return slot ? `${slot.charAt(0).toUpperCase()}${slot.slice(1)}` : "Meal";
}

function makeUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "00000000-0000-4000-8000-" + Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
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

function mutationIdFor(action = {}) {
  const identity = clean(action?.id || action?.vnext_action_id || action?.sourceTurnId || "", 180) || hashText(JSON.stringify(action || {}));
  const key = `${MUTATION_PREFIX}${identity}`;
  try {
    const current = clean(sessionStorage.getItem(key), 80);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(current)) return current;
    const id = makeUuid();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return makeUuid();
  }
}

export function normalizeItems(plan = {}) {
  const source = array(plan?.items);
  if (source.length) {
    return source.slice(0, 16).map((item, index) => {
      const name = clean(item?.name, 180);
      if (!name) return null;
      return {
        id: clean(item?.id, 160) || `component-${index}`,
        name,
        amount: clean(item?.amount ?? item?.serving_size, 180),
        calories: Math.max(0, Math.round(finite(item?.calories) ?? 0)),
        protein_g: round1(item?.protein_g ?? item?.proteinG ?? item?.protein),
        carbs_g: round1(item?.carbs_g ?? item?.carbsG ?? item?.carbs ?? item?.carbohydrates),
        fat_g: round1(item?.fat_g ?? item?.fatG ?? item?.fat)
      };
    }).filter(Boolean);
  }
  return [{
    id: "whole-meal",
    name: clean(plan?.name, 180) || "Meal",
    amount: clean(plan?.serving_size, 180) || "Planned serving",
    calories: Math.max(0, Math.round(finite(plan?.calories) ?? 0)),
    protein_g: round1(plan?.protein_g),
    carbs_g: round1(plan?.carbs_g),
    fat_g: round1(plan?.fat_g)
  }];
}

function sumItems(items = []) {
  return array(items).reduce((totals, item) => {
    totals.calories += Math.max(0, finite(item?.calories) ?? 0);
    totals.protein_g += Math.max(0, finite(item?.protein_g) ?? 0);
    totals.carbs_g += Math.max(0, finite(item?.carbs_g) ?? 0);
    totals.fat_g += Math.max(0, finite(item?.fat_g) ?? 0);
    return totals;
  }, { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
}

export function replacementFromArgs(args = {}) {
  const name = clean(args?.name, 180);
  const calories = finite(args?.calories);
  const protein = finite(args?.proteinG ?? args?.protein_g);
  const carbs = finite(args?.carbsG ?? args?.carbs_g);
  const fat = finite(args?.fatG ?? args?.fat_g);
  if (!name || calories === null || calories <= 0 || calories > 5000) return null;
  if ([protein, carbs, fat].some((value) => value === null || value < 0 || value > 2000)) return null;
  return {
    name,
    calories: Math.round(calories),
    protein_g: round1(protein),
    carbs_g: round1(carbs),
    fat_g: round1(fat),
    serving_size: clean(args?.servingSize ?? args?.serving_size, 220) || "Planned by Ari",
    notes: clean(args?.notes, 500)
  };
}

export async function validateReplacementBudget(plan = {}, replacement = {}) {
  try {
    const context = await window?.CalBuddy?.getUserContext?.();
    const dailyGoal = finite(context?.dailyGoal);
    if (dailyGoal === null || dailyGoal <= 0) return { valid: true };
    const consumed = Math.max(0, finite(context?.caloriesConsumed) ?? 0);
    const planned = Math.max(0, finite(context?.plannedCalories) ?? 0);
    const allowance = Math.max(0, dailyGoal - consumed);
    const nextPlanned = Math.max(0, planned - Math.max(0, finite(plan?.calories) ?? 0) + replacement.calories);
    const tolerance = Math.max(100, Math.round(allowance * 0.1));
    if (nextPlanned > allowance + tolerance) {
      return { valid: false, message: "That replacement would put today’s active Meal Plan above the saved calories remaining, so Ari will not replace it as-is." };
    }
  } catch {}
  return { valid: true };
}

function consumedFromPlan(plan = {}, selectedIndexes = null) {
  const components = normalizeItems(plan);
  if (!Array.isArray(selectedIndexes)) {
    return {
      consumed: {
        name: clean(plan?.name, 180) || "Meal",
        calories: Math.max(1, Math.round(finite(plan?.calories) ?? 0)),
        category: slotLabel(plan?.meal_slot),
        protein_g: round1(plan?.protein_g),
        carbs_g: round1(plan?.carbs_g),
        fat_g: round1(plan?.fat_g),
        serving_size: clean(plan?.serving_size, 220) || "From today’s Meal Plan"
      },
      remaining: null,
      selectedNames: [clean(plan?.name, 180) || "Meal"]
    };
  }

  const selected = new Set(selectedIndexes.filter((index) => Number.isInteger(index) && components[index]));
  const consumedItems = components.filter((_, index) => selected.has(index));
  const remainingItems = components.filter((_, index) => !selected.has(index));
  if (!consumedItems.length) return null;
  const consumedTotals = sumItems(consumedItems);
  const selectedNames = consumedItems.map((item) => item.name);
  const consumed = {
    name: selectedNames.length <= 3 ? selectedNames.join(" + ") : `${clean(plan?.name, 180) || slotLabel(plan?.meal_slot)} · selected items`,
    calories: Math.max(1, Math.round(consumedTotals.calories)),
    category: slotLabel(plan?.meal_slot),
    protein_g: round1(consumedTotals.protein_g),
    carbs_g: round1(consumedTotals.carbs_g),
    fat_g: round1(consumedTotals.fat_g),
    serving_size: "Selected from today’s Meal Plan"
  };
  if (!remainingItems.length) return { consumed, remaining: null, selectedNames };
  const remainingTotals = sumItems(remainingItems);
  return {
    consumed,
    selectedNames,
    remaining: {
      name: remainingItems.map((item) => item.name).slice(0, 3).join(" + ") || `${slotLabel(plan?.meal_slot)} remaining items`,
      calories: Math.round(remainingTotals.calories),
      protein_g: round1(remainingTotals.protein_g),
      carbs_g: round1(remainingTotals.carbs_g),
      fat_g: round1(remainingTotals.fat_g),
      serving_size: "Remaining planned items",
      items: remainingItems
    }
  };
}

async function refreshNutrition(action, detail = {}) {
  try { await window?.AriNutritionPage?.refresh?.(); } catch {}
  try { await window?.CalBuddy?.getConsumedCalories?.(); } catch {}
  try {
    window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", { detail: { action, source: "nutrition_plan_service", version: "1.0.0", ...detail } }));
    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", { detail: { action, source: "nutrition_plan_service", version: "1.0.0", ...detail } }));
  } catch {}
}

function bindConsumedReference(action, plan, consumed, data = {}) {
  const state = window?.AriVNextReferenceState;
  if (!state?.rememberPending || !state?.commit || !data?.mealId || !data?.mutationId) return;
  const synthetic = {
    id: `plan_consumed_${clean(action?.id, 120) || hashText(data.mutationId)}`,
    name: "log_meal",
    sourceTurnId: clean(action?.sourceTurnId, 180) || "plan-consume",
    sourceMessage: clean(action?.sourceMessage, 600),
    arguments: {
      name: consumed.name,
      calories: consumed.calories,
      mealCategory: consumed.category,
      servingSize: consumed.serving_size,
      proteinG: consumed.protein_g,
      carbsG: consumed.carbs_g,
      fatG: consumed.fat_g,
      quantity: 1
    }
  };
  state.rememberPending({ pendingAction: synthetic });
  state.commit({ pendingAction: synthetic, execution: { success: true, result: { meal: { id: data.mealId, ...consumed, nutrition_date: clean(plan?.plan_date, 40) }, mutationId: data.mutationId, nutritionDate: clean(plan?.plan_date, 40) } } });
}

export async function consumePlan({ action = {}, plan = {}, selectedIndexes = null } = {}) {
  const client = window?.calbuddySupabase;
  if (!client?.rpc || !plan?.id) return failure("meal_plan_transaction_unavailable", "The trusted Meal Plan transaction service is not ready yet.");
  const built = consumedFromPlan(plan, selectedIndexes);
  if (!built?.consumed) return failure("meal_plan_component_reference_stale", "Those planned items changed before confirmation. Ask Ari to show the current Meal Plan again.");
  const mutationId = mutationIdFor(action);
  const { data, error } = await client.rpc("ari_consume_nutrition_plan", {
    p_plan_id: plan.id,
    p_mutation_id: mutationId,
    p_consumed: built.consumed,
    p_remaining: built.remaining
  });
  if (error) return failure("meal_plan_transaction_failed", error.message || "That planned meal could not be logged. Nothing was changed.");
  await refreshNutrition(built.remaining ? "referenced_plan_partially_eaten" : "referenced_plan_eaten", { planId: clean(plan.id, 180), mutationId: clean(data?.mutationId || mutationId, 80) });
  bindConsumedReference(action, plan, built.consumed, data || {});
  return {
    success: true,
    result: { ...(data || {}), meal: { id: data?.mealId || null, ...built.consumed, nutrition_date: clean(plan?.plan_date, 40) }, mutationId: data?.mutationId || mutationId, nutritionDate: clean(plan?.plan_date, 40) },
    reply: built.remaining ? `${built.selectedNames.join(", ")} logged. The remaining planned items are still in today’s Meal Plan.` : `${built.consumed.name} is logged as eaten.`
  };
}

export async function discardPlan(plan = {}) {
  const sync = window?.AriNutritionPlanSync;
  if (!sync?.pushRecords || !sync?.loadToday || !plan?.id) return failure("meal_plan_sync_unavailable", "The Meal Plan service is not ready right now.");
  await sync.pushRecords([{ ...plan, cloud_id: plan.id, status: "skipped", updated_at: new Date().toISOString() }]);
  const current = await sync.loadToday();
  if (array(current).some((item) => clean(item?.id, 180) === clean(plan?.id, 180) && clean(item?.status || "planned", 40) === "planned")) {
    return failure("meal_plan_discard_not_verified", "That planned meal did not leave the active Meal Plan, so Ari did not report it as discarded.");
  }
  await refreshNutrition("referenced_plan_discarded", { planId: clean(plan.id, 180) });
  return { success: true, result: { planId: plan.id, status: "skipped" }, reply: `${clean(plan?.name, 180) || slotLabel(plan?.meal_slot)} removed from today’s Meal Plan.` };
}

export async function replacePlan({ plan = {}, replacement = {} } = {}) {
  const normalized = replacementFromArgs(replacement);
  if (!normalized) return failure("meal_plan_replacement_invalid", "The replacement meal details are incomplete or outside supported nutrition ranges.");
  const budget = await validateReplacementBudget(plan, normalized);
  if (!budget.valid) return failure("meal_plan_replacement_budget_invalid", budget.message);
  const sync = window?.AriNutritionPlanSync;
  if (!sync?.pushRecords || !sync?.loadToday || !plan?.id) return failure("meal_plan_sync_unavailable", "The Meal Plan service is not ready right now.");
  const record = {
    ...plan,
    ...normalized,
    cloud_id: plan.id,
    meal_slot: normalizeSlot(plan?.meal_slot),
    plan_date: clean(plan?.plan_date, 40),
    status: "planned",
    items: [{ id: "whole-meal", name: normalized.name, amount: normalized.serving_size, calories: normalized.calories, protein_g: normalized.protein_g, carbs_g: normalized.carbs_g, fat_g: normalized.fat_g }],
    updated_at: new Date().toISOString()
  };
  await sync.pushRecords([record]);
  const current = await sync.loadToday();
  const verified = array(current).find((item) => clean(item?.id, 180) === clean(plan?.id, 180));
  if (!verified || clean(verified?.name, 180) !== normalized.name || Math.round(finite(verified?.calories) ?? 0) !== normalized.calories) {
    return failure("meal_plan_replacement_not_verified", "The replacement could not be verified against the current Meal Plan, so Ari will not claim it changed.");
  }
  await refreshNutrition("referenced_plan_replaced", { planId: clean(plan.id, 180) });
  return { success: true, result: { planItemId: plan.id, plan: verified }, reply: `${slotLabel(plan.meal_slot)} is now ${normalized.name} — about ${normalized.calories} kcal.` };
}

export const NutritionPlanService = Object.freeze({
  normalizeItems,
  replacementFromArgs,
  validateReplacementBudget,
  consumePlan,
  discardPlan,
  replacePlan
});

export default NutritionPlanService;
