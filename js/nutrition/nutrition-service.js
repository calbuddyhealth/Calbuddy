// Canonical Nutrition mutation service.
// Owns resolved meal persistence, reference-bound meal updates, and idempotent mutation identity.

const MUTATION_PREFIX = "ari_resolved_nutrition_mutation_v2";
const ALLOWED_MEAL_UPDATE_FIELDS = new Set([
  "name",
  "calories",
  "category",
  "protein_g",
  "carbs_g",
  "fat_g",
  "serving_size",
  "multiplier"
]);

function clean(value = "", max = 240) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function number(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function object(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function failure(code, message) {
  return { success: false, code, message };
}

function makeMutationId() {
  if (typeof window?.crypto?.randomUUID === "function") return window.crypto.randomUUID();
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return "00000000-0000-4000-8000-" + Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
}

function hash(value = "") {
  const source = String(value || "resolved-nutrition");
  let result = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    result ^= source.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function mutationStorageKey(action = {}) {
  const identity = clean(action?.vnext_action_id || action?.vnext_source_turn_id || "", 220);
  return `${MUTATION_PREFIX}:${hash(identity || "fallback")}`;
}

function mutationIdForAction(action = {}) {
  const key = mutationStorageKey(action);
  try {
    const existing = sessionStorage.getItem(key);
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing || "")) {
      return { id: existing, key };
    }
    const id = makeMutationId();
    sessionStorage.setItem(key, id);
    return { id, key };
  } catch {
    return { id: makeMutationId(), key: null };
  }
}

function clearMutationStorage(key) {
  if (!key) return;
  try { sessionStorage.removeItem(key); } catch {}
}

function localDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const safe = Number.isFinite(date.getTime()) ? date : new Date();
  const year = safe.getFullYear();
  const month = String(safe.getMonth() + 1).padStart(2, "0");
  const day = String(safe.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function resolveNutritionDate() {
  if (typeof window?.CalBuddy?.getNutritionWindow === "function") {
    try {
      const date = clean((await window.CalBuddy.getNutritionWindow())?.nutritionDate, 20);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    } catch {}
  }
  return localDate();
}

async function currentSession() {
  try {
    if (typeof window?.CalBuddy?.getCurrentSession === "function") {
      const session = await window.CalBuddy.getCurrentSession();
      if (session) return session;
    }
  } catch {}
  try {
    const client = window?.calbuddySupabase;
    if (!client?.auth?.getSession) return null;
    const { data } = await client.auth.getSession();
    return data?.session || null;
  } catch {
    return null;
  }
}

function updateConsumedCache(data = {}, fallbackDate = "") {
  try {
    if (Number.isFinite(Number(data?.todayCalories))) {
      localStorage.setItem("calbuddyCaloriesConsumed", String(Math.round(Number(data.todayCalories))));
      const date = clean(data?.nutritionDate || fallbackDate, 20);
      if (date) localStorage.setItem("calbuddyCaloriesConsumedDate", date);
    }
  } catch {}
}

function dispatchMealMutation({ action, mutationId, previousMutationId = null, meal = null, todayCalories = null, undoAvailable = false, resolution = null }) {
  try {
    window.dispatchEvent(new CustomEvent("ari:nutritionMutationCommitted", {
      detail: {
        action,
        mutationId,
        previousMutationId,
        meal,
        todayCalories,
        undoAvailable,
        resolution,
        source: "nutrition_service",
        version: "1.1.0"
      }
    }));
    window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
      detail: {
        action: action === "update_meal" ? "update" : "log",
        meal,
        mutationId
      }
    }));
  } catch {}
}

export async function logResolvedMeal(action = {}) {
  const payload = object(action.payload);
  const client = window?.calbuddySupabase;
  const session = await currentSession();
  if (!session?.user?.id || !client?.rpc) {
    return failure("resolved_nutrition_session_required", "A signed-in ARI XP session is required to save resolved nutrition.");
  }

  const mutation = mutationIdForAction(action);
  const nutritionDate = await resolveNutritionDate();
  const meal = {
    name: clean(payload.name, 220),
    calories: Math.round(number(payload.calories, 0)),
    category: clean(payload.category, 80) || "Meal",
    nutrition_date: nutritionDate,
    protein_g: Math.max(0, number(payload.protein_g, 0)),
    carbs_g: Math.max(0, number(payload.carbs_g, 0)),
    fat_g: Math.max(0, number(payload.fat_g, 0)),
    serving_size: clean(payload.serving_size, 500) || "Resolved by Ari Nutrition",
    multiplier: 1,
    is_favorite: false,
    created_at: new Date().toISOString()
  };

  window?.CalBuddy?.setAriMood?.("logging");
  const { data, error } = await client.rpc("ari_log_resolved_nutrition_meal", {
    p_mutation_id: mutation.id,
    p_meal: meal,
    p_components: Array.isArray(payload.ari_components) ? payload.ari_components : [],
    p_resolution: object(payload.ari_resolution)
  });

  if (error) {
    window?.CalBuddy?.setAriMood?.("concerned");
    return failure("resolved_nutrition_write_failed", error.message || "The resolved meal could not be saved. Nothing was changed.");
  }

  clearMutationStorage(mutation.key);
  const saved = data?.meal && typeof data.meal === "object"
    ? { ...data.meal, source: "supabase" }
    : { ...meal, id: data?.mealId || null, source: "supabase" };
  saved.ari_mutation_id = mutation.id;
  saved.ari_today_calories = number(data?.todayCalories, null);
  saved.ari_undo_available = data?.undoAvailable === true;
  saved.ari_resolution = data?.resolution || payload.ari_resolution || null;

  updateConsumedCache(data, nutritionDate);
  dispatchMealMutation({
    action: "log_meal",
    mutationId: mutation.id,
    meal: saved,
    todayCalories: data?.todayCalories ?? null,
    undoAvailable: data?.undoAvailable === true,
    resolution: data?.resolution || payload.ari_resolution || null
  });

  window?.CalBuddy?.setAriMood?.("success");
  return {
    success: true,
    result: saved,
    meal: saved,
    mutationId: mutation.id,
    todayCalories: data?.todayCalories ?? null,
    undoAvailable: data?.undoAvailable === true,
    resolution: data?.resolution || payload.ari_resolution || null,
    reply: `${saved.name || "Meal"} logged${Number.isFinite(Number(data?.todayCalories)) ? ` · ${Math.round(Number(data.todayCalories)).toLocaleString()} kcal today` : ""}.`
  };
}

export function normalizeMealChanges(changes = []) {
  if (!Array.isArray(changes) || !changes.length) {
    return failure("nutrition_reference_changes_required", "Tell Ari what should change about that meal.");
  }

  const payload = {};
  const seen = new Set();
  for (const change of changes.slice(0, 8)) {
    const field = clean(change?.field, 80).toLowerCase();
    if (!ALLOWED_MEAL_UPDATE_FIELDS.has(field) || seen.has(field)) {
      return failure("nutrition_reference_change_invalid", "That meal change is not supported safely.");
    }
    seen.add(field);

    if (["calories", "protein_g", "carbs_g", "fat_g", "multiplier"].includes(field)) {
      const value = Number(change?.numberValue);
      if (!Number.isFinite(value)) return failure(`nutrition_reference_${field}_invalid`, "That meal number is invalid.");
      if (field === "calories" && (value <= 0 || value > 10000)) return failure("nutrition_reference_calories_invalid", "Meal calories are outside the supported range.");
      if (["protein_g", "carbs_g", "fat_g"].includes(field) && (value < 0 || value > 2000)) return failure(`nutrition_reference_${field}_invalid`, "That macro value is outside the supported range.");
      if (field === "multiplier" && (value <= 0 || value > 100)) return failure("nutrition_reference_multiplier_invalid", "That serving multiplier is outside the supported range.");
      payload[field] = value;
      continue;
    }

    const value = clean(change?.textValue, field === "name" ? 180 : 220);
    if (!value) return failure(`nutrition_reference_${field}_invalid`, "That meal text value is required.");
    payload[field] = value;
  }
  return { success: true, payload };
}

export async function updateMeal({ mealId = "", changes = [] } = {}) {
  const id = clean(mealId, 160);
  if (!/^[0-9a-f-]{20,}$/i.test(id)) {
    return failure("nutrition_reference_meal_identity_required", "That meal could not be identified safely.");
  }

  const normalized = normalizeMealChanges(changes);
  if (!normalized.success) return normalized;

  const client = window?.calbuddySupabase;
  const session = await currentSession();
  if (!session?.user?.id || typeof client?.rpc !== "function") {
    return failure("nutrition_reference_session_required", "Meal edits require a signed-in ARI XP session.");
  }

  const mutationId = makeMutationId();
  const { data, error } = await client.rpc("ari_update_nutrition_meal", {
    p_mutation_id: mutationId,
    p_meal_id: id,
    p_changes: normalized.payload
  });

  if (error) {
    return failure("nutrition_reference_update_failed", error.message || "That meal could not be updated. Nothing else was changed.");
  }

  updateConsumedCache(data);
  try { await window?.CalBuddy?.getConsumedCalories?.(); } catch {}
  dispatchMealMutation({
    action: "update_meal",
    mutationId: data?.mutationId || mutationId,
    previousMutationId: data?.previousMutationId || null,
    meal: data?.meal || null,
    todayCalories: data?.todayCalories ?? null,
    undoAvailable: data?.undoAvailable === true
  });

  return {
    success: true,
    ...data,
    mutationId: data?.mutationId || mutationId,
    source: "nutrition_service"
  };
}

export const NutritionService = Object.freeze({
  logResolvedMeal,
  normalizeMealChanges,
  updateMeal
});

export default NutritionService;
