/* ARI Nutrition Scan Save Bridge v1.0.0
   Intercepts only scanner-originated Save Meal clicks so scanned serving
   metadata is preserved without changing the existing manual meal editor. */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const n = (value, fallback = 0) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  function localDate(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function resolveNutritionDate(date = new Date()) {
    let reset = { hour: 4, minute: 0, ampm: "AM" };
    try {
      const saved = JSON.parse(localStorage.getItem("calbuddyResetTime") || "null");
      if (saved && typeof saved === "object") reset = { ...reset, ...saved };
    } catch {}

    let hour = n(reset.hour, 4);
    const minute = n(reset.minute, 0);
    const ampm = String(reset.ampm || "AM").toUpperCase();
    if (ampm === "AM" && hour === 12) hour = 0;
    else if (ampm === "PM" && hour !== 12) hour += 12;

    const resetPoint = new Date(date);
    resetPoint.setHours(hour, minute, 0, 0);
    if (date < resetPoint) resetPoint.setDate(resetPoint.getDate() - 1);
    return localDate(resetPoint);
  }

  async function saveScannerMeal(event) {
    const context = window.AriNutritionScanBridge?.getFormContext?.();
    if (!context) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const button = $("saveMealBtn");
    if (button?.dataset.scanSaving === "true") return;
    if (button) {
      button.dataset.scanSaving = "true";
      button.disabled = true;
    }

    const name = String($("mealName")?.value || "").trim();
    const calories = n($("mealCalories")?.value, NaN);
    if (!name || !Number.isFinite(calories) || calories < 0) {
      if (button) {
        button.disabled = false;
        delete button.dataset.scanSaving;
      }
      window.alert("ARI could not save this scan. Check the product name and calories.");
      return;
    }

    try {
      const client = window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase;
      if (!client?.auth?.getSession || !client?.from) throw new Error("ARI account service is unavailable.");
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData?.session?.user;
      if (!user?.id) throw new Error("Sign in to save this meal.");

      const mealDate = $("mealDate")?.value || localDate();
      const mealTime = $("mealTime")?.value || `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
      const timestamp = new Date(`${mealDate}T${mealTime}:00`);
      const createdAt = Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;

      const record = {
        user_id: user.id,
        name,
        calories: Math.round(calories),
        category: String($("mealType")?.value || "Meal"),
        nutrition_date: resolveNutritionDate(createdAt),
        protein_g: Math.max(0, n($("mealProtein")?.value, 0)),
        carbs_g: Math.max(0, n($("mealCarbs")?.value, 0)),
        fat_g: Math.max(0, n($("mealFat")?.value, 0)),
        serving_size: String(context.servingSize || "1 serving"),
        multiplier: Math.max(.01, n(context.multiplier, 1)),
        is_favorite: false,
        created_at: createdAt.toISOString()
      };

      const { error } = await client.from("meals").insert(record);
      if (error) throw error;

      await window.AriNutritionScanBridge?.onMealSaved?.(record);

      const label = $("saveMealLabel");
      if (label) label.textContent = "Saved";
      window.setTimeout(() => window.location.reload(), 280);
    } catch (error) {
      console.error("[ARI Nutrition Scan Save]", error);
      if (button) {
        button.disabled = false;
        delete button.dataset.scanSaving;
      }
      window.alert(error?.message || "The scanned meal could not be saved.");
    }
  }

  document.addEventListener("click", (event) => {
    if (event.target?.closest?.("#saveMealBtn")) saveScannerMeal(event);
  }, true);
})();
