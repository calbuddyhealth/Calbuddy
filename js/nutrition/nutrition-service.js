// Canonical Nutrition mutation service.
// Owns resolved meal persistence and idempotent mutation identity.

const MUTATION_PREFIX = "ari_resolved_nutrition_mutation_v2";

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

export async function logResolvedMeal(action = {}) {
  const payload = object(action.payload);
  const client = window?.calbuddySupabase;
  const session = await currentSession();
  if (!session?.user?.id || !client?.rpc) {
    return { success: false, code: "resolved_nutrition_session_required", error: "A signed-in ARI XP session is required to save resolved nutrition." };
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
    return { success: false, code: "resolved_nutrition_write_failed", error: error.message || "The resolved meal could not be saved. Nothing was changed." };
  }

  clearMutationStorage(mutation.key);
  const saved = data?.meal && typeof data.meal === "object"
    ? { ...data.meal, source: "supabase" }
    : { ...meal, id: data?.mealId || null, source: "supabase" };
  saved.ari_mutation_id = mutation.id;
  saved.ari_today_calories = number(data?.todayCalories, null);
  saved.ari_undo_available = data?.undoAvailable === true;
  saved.ari_resolution = data?.resolution || payload.ari_resolution || null;

  try {
    if (Number.isFinite(Number(data?.todayCalories))) {
      localStorage.setItem("calbuddyCaloriesConsumed", String(Math.round(Number(data.todayCalories))));
      localStorage.setItem("calbuddyCaloriesConsumedDate", String(data?.nutritionDate || nutritionDate));
    }
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent("ari:nutritionMutationCommitted", {
      detail: {
        action: "log_meal",
        mutationId: mutation.id,
        meal: saved,
        todayCalories: data?.todayCalories ?? null,
        undoAvailable: data?.undoAvailable === true,
        resolution: data?.resolution || payload.ari_resolution || null,
        source: "nutrition_service",
        version: "1.0.0"
      }
    }));
    window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
      detail: { action: "log", meal: saved, mutationId: mutation.id }
    }));
  } catch {}

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

export const NutritionService = Object.freeze({
  logResolvedMeal
});

export default NutritionService;
