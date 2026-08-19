// ARI XP — hard boundary between nutrition intake and completed activity.
// Prevents stale/legacy action paths from storing exercise as a meal.

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const ACTIVITY_CATEGORIES = new Set(["exercise", "activity", "workout", "training"]);
  let patchTimer = null;

  function clean(value = "", max = 500) {
    return String(value ?? "").trim().slice(0, max);
  }

  function isActivityMeal(value = {}) {
    const category = clean(value?.category, 80).toLowerCase();
    return ACTIVITY_CATEGORIES.has(category);
  }

  function parseDurationMinutes(value = "") {
    const text = clean(value, 160).toLowerCase();
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min)\b/);
    if (!match) return null;
    const minutes = Number(match[1]);
    return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
  }

  async function loadActivityService() {
    if (window.AriActivityLogService?.logActivity) return window.AriActivityLogService;
    try {
      const module = await import("./training/activity-log-service.js?v=1.1.0");
      return module?.default || module?.ActivityLogService || window.AriActivityLogService || null;
    } catch (error) {
      console.warn("Activity service unavailable for meal boundary:", error?.message || error);
      return null;
    }
  }

  async function redirectActivityMeal(meal = {}) {
    const calories = Number(meal?.calories || meal?.calories_burned || 0);
    const activityName = clean(meal?.activity_name || meal?.name, 180) || "Activity";
    const durationMinutes = Number(meal?.duration_minutes) > 0
      ? Number(meal.duration_minutes)
      : parseDurationMinutes(meal?.serving_size);

    const service = await loadActivityService();
    if (service?.logActivity) {
      const result = await service.logActivity({
        activityName,
        caloriesBurned: calories > 0 ? calories : null,
        durationMinutes,
        dateText: meal?.nutrition_date || meal?.log_date || "today",
        notes: clean(meal?.notes, 500),
        source: "meal_activity_boundary"
      }, { source: "meal_activity_boundary" });

      if (result?.success === false) {
        throw new Error(result?.message || "Activity could not be redirected from meal logging.");
      }
      return result;
    }

    if (typeof window.CalBuddy?.logCaloriesBurned === "function" && calories > 0) {
      return await window.CalBuddy.logCaloriesBurned({
        calories_burned: calories,
        activity_name: activityName
      });
    }

    throw new Error("Activity logging is unavailable. Exercise was not saved as a meal.");
  }

  function filterMealRows(rows) {
    return Array.isArray(rows) ? rows.filter((row) => !isActivityMeal(row)) : rows;
  }

  function patchCalBuddy() {
    const calBuddy = window.CalBuddy;
    if (!calBuddy || typeof calBuddy.logMeal !== "function") return false;
    if (calBuddy.__mealActivityBoundaryV1 === true) return true;

    const originalLogMeal = calBuddy.logMeal.bind(calBuddy);
    calBuddy.logMeal = async function guardedLogMeal(meal = {}) {
      if (isActivityMeal(meal)) return await redirectActivityMeal(meal);
      return await originalLogMeal(meal);
    };

    if (typeof calBuddy.getMealsInWindow === "function") {
      const originalGetMealsInWindow = calBuddy.getMealsInWindow.bind(calBuddy);
      calBuddy.getMealsInWindow = async function guardedGetMealsInWindow(...args) {
        return filterMealRows(await originalGetMealsInWindow(...args));
      };
    }

    if (typeof calBuddy.getRecentMeals === "function") {
      const originalGetRecentMeals = calBuddy.getRecentMeals.bind(calBuddy);
      calBuddy.getRecentMeals = async function guardedGetRecentMeals(...args) {
        return filterMealRows(await originalGetRecentMeals(...args));
      };
    }

    Object.defineProperty(calBuddy, "__mealActivityBoundaryV1", {
      configurable: false,
      enumerable: false,
      value: true
    });

    window.dispatchEvent(new CustomEvent("ari:mealActivityBoundaryReady", {
      detail: { version: VERSION }
    }));
    return true;
  }

  function ensurePatched() {
    window.clearTimeout(patchTimer);
    if (patchCalBuddy()) return;
    patchTimer = window.setTimeout(ensurePatched, 40);
  }

  window.addEventListener("ari:runtimeReady", ensurePatched);
  window.addEventListener("ari:runtimeChanged", ensurePatched);
  ensurePatched();

  window.AriMealActivityBoundary = Object.freeze({
    version: VERSION,
    isActivityMeal,
    ensurePatched
  });
})();
