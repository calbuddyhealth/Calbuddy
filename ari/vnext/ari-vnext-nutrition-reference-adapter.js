// ARI vNext — trusted reference-bound Nutrition meal edits.
// The model supplies only a recent Ari reference and explicit field changes.
// This adapter receives the canonical meal ID from the browser reference layer,
// revalidates the signed-in session, and writes through a journaled Supabase RPC.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const SOURCE = "ari_vnext_nutrition_reference_adapter";
  const ALLOWED_FIELDS = new Set([
    "name",
    "calories",
    "category",
    "protein_g",
    "carbs_g",
    "fat_g",
    "serving_size",
    "multiplier"
  ]);

  function clean(value = "", max = 500) {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function makeMutationId() {
    if (typeof window.crypto?.randomUUID === "function") return window.crypto.randomUUID();
    return "00000000-0000-4000-8000-" +
      Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
  }

  async function currentSession() {
    if (typeof window.CalBuddy?.getCurrentSession === "function") {
      return await window.CalBuddy.getCurrentSession();
    }
    if (!window.calbuddySupabase?.auth?.getSession) return null;
    const { data, error } = await window.calbuddySupabase.auth.getSession();
    return error ? null : data?.session || null;
  }

  function normalizeChanges(changes = []) {
    if (!Array.isArray(changes) || !changes.length) {
      return { success: false, code: "nutrition_reference_changes_required", message: "Tell Ari what should change about that meal." };
    }

    const payload = {};
    const seen = new Set();
    for (const change of changes.slice(0, 8)) {
      const field = clean(change?.field, 80).toLowerCase();
      if (!ALLOWED_FIELDS.has(field) || seen.has(field)) {
        return { success: false, code: "nutrition_reference_change_invalid", message: "That meal change is not supported safely." };
      }
      seen.add(field);

      if (["calories", "protein_g", "carbs_g", "fat_g", "multiplier"].includes(field)) {
        const value = Number(change?.numberValue);
        if (!Number.isFinite(value)) {
          return { success: false, code: `nutrition_reference_${field}_invalid`, message: "That meal number is invalid." };
        }
        if (field === "calories" && (value <= 0 || value > 10000)) {
          return { success: false, code: "nutrition_reference_calories_invalid", message: "Meal calories are outside the supported range." };
        }
        if (["protein_g", "carbs_g", "fat_g"].includes(field) && (value < 0 || value > 2000)) {
          return { success: false, code: `nutrition_reference_${field}_invalid`, message: "That macro value is outside the supported range." };
        }
        if (field === "multiplier" && (value <= 0 || value > 100)) {
          return { success: false, code: "nutrition_reference_multiplier_invalid", message: "That serving multiplier is outside the supported range." };
        }
        payload[field] = value;
        continue;
      }

      const value = clean(change?.textValue, field === "name" ? 180 : 220);
      if (!value) {
        return { success: false, code: `nutrition_reference_${field}_invalid`, message: "That meal text value is required." };
      }
      payload[field] = value;
    }

    return { success: true, payload };
  }

  async function updateReferencedMeal({ mealId = "", changes = [] } = {}) {
    const id = clean(mealId, 160);
    if (!/^[0-9a-f-]{20,}$/i.test(id)) {
      return { success: false, code: "nutrition_reference_meal_identity_required", message: "That meal could not be identified safely." };
    }

    const normalized = normalizeChanges(changes);
    if (!normalized.success) return normalized;

    const client = window.calbuddySupabase;
    const session = await currentSession();
    if (!session?.user?.id || typeof client?.rpc !== "function") {
      return { success: false, code: "nutrition_reference_session_required", message: "Meal edits require a signed-in ARI XP session." };
    }

    const mutationId = makeMutationId();
    const { data, error } = await client.rpc("ari_update_nutrition_meal", {
      p_mutation_id: mutationId,
      p_meal_id: id,
      p_changes: normalized.payload
    });

    if (error) {
      return {
        success: false,
        code: "nutrition_reference_update_failed",
        message: error.message || "That meal could not be updated. Nothing else was changed."
      };
    }

    try {
      if (Number.isFinite(Number(data?.todayCalories))) {
        localStorage.setItem("calbuddyCaloriesConsumed", String(Math.round(Number(data.todayCalories))));
        if (data?.nutritionDate) {
          localStorage.setItem("calbuddyCaloriesConsumedDate", String(data.nutritionDate));
        }
      }
    } catch {
      // Cloud truth is authoritative when storage is restricted.
    }

    try {
      await window.CalBuddy?.getConsumedCalories?.();
    } catch {
      // The journaled RPC already returned authoritative totals.
    }

    window.dispatchEvent(new CustomEvent("ari:nutritionMutationCommitted", {
      detail: {
        action: "update_meal",
        mutationId: data?.mutationId || mutationId,
        previousMutationId: data?.previousMutationId || null,
        meal: data?.meal || null,
        todayCalories: data?.todayCalories ?? null,
        undoAvailable: data?.undoAvailable === true,
        source: SOURCE,
        version: VERSION
      }
    }));

    window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
      detail: {
        action: "update",
        meal: data?.meal || null,
        mutationId: data?.mutationId || mutationId
      }
    }));

    return {
      success: true,
      ...data,
      mutationId: data?.mutationId || mutationId,
      source: SOURCE
    };
  }

  window.AriVNextNutritionReferenceAdapter = Object.freeze({
    version: VERSION,
    source: SOURCE,
    ready: true,
    updateReferencedMeal
  });

  window.dispatchEvent(new CustomEvent("ari:vnextNutritionReferenceReady", {
    detail: { version: VERSION }
  }));
})();
