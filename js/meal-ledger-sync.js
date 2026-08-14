// =====================================================
// ARI XP
// File: js/meal-ledger-sync.js
// Version: 1.0.1
// Purpose:
//   Make meals, Nutrition, Goals, and Ari use one canonical
//   daily ledger and one calendar-day boundary.
//
// Canonical rules:
//   - public.meals is the only active meal ledger.
//   - A day runs from local midnight to local midnight.
//   - Ari meal logging and manual Nutrition logging use the
//     same writer when CalBuddy is available.
//   - Cloud and local-fallback meals are merged for totals.
//   - Goals reads the same synchronized calorie total.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.0.1";
  const MIDNIGHT_RESET = Object.freeze({
    hour: 12,
    minute: 0,
    ampm: "AM"
  });

  const LOCAL_MEALS_KEY = "calbuddyMeals";
  const CALORIES_KEY = "calbuddyCaloriesConsumed";
  const CALORIES_DATE_KEY = "calbuddyCaloriesConsumedDate";
  const ACTIVE_DATE_KEY = "calbuddyActiveNutritionDate";
  const RESET_TIME_KEY = "calbuddyResetTime";

  const page = String(window.location.pathname || "")
    .split("/")
    .pop()
    .toLowerCase();

  const ACTIVE_PAGES = new Set([
    "",
    "home.html",
    "nutrition.html",
    "goals.html",
    "progress.html",
    "log.html"
  ]);

  if (!ACTIVE_PAGES.has(page)) {
    return;
  }

  let nutritionPatched = false;
  let goalsPatched = false;

  function safeNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getCalendarWindow(offset = 0, reference = new Date()) {
    const start = new Date(reference);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + Number(offset || 0));

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const nutritionDate = formatLocalDate(start);

    return {
      start,
      end,
      nutritionDate,
      dateKey: `${nutritionDate}_0000`
    };
  }

  function normalizeMealDate(value, fallback = new Date()) {
    const date = value instanceof Date
      ? new Date(value)
      : new Date(value || fallback);

    return Number.isNaN(date.getTime())
      ? new Date(fallback)
      : date;
  }

  function readLocalMeals() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_MEALS_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeLocalMeals(meals) {
    localStorage.setItem(
      LOCAL_MEALS_KEY,
      JSON.stringify(Array.isArray(meals) ? meals : [])
    );
  }

  function getMealDate(meal) {
    return normalizeMealDate(
      meal?.created_at ||
      meal?.createdAt ||
      meal?.date ||
      meal?.nutrition_date,
      new Date(0)
    );
  }

  function mergeMeals(...collections) {
    const merged = [];
    const ids = new Set();

    for (const collection of collections) {
      for (const meal of Array.isArray(collection) ? collection : []) {
        const id = meal?.id == null ? "" : String(meal.id);

        if (id && ids.has(id)) {
          continue;
        }

        if (id) {
          ids.add(id);
        }

        merged.push(meal);
      }
    }

    return merged;
  }

  function localMealsInWindow(windowInfo) {
    return readLocalMeals()
      .filter((meal) => {
        const created = getMealDate(meal);
        return created >= windowInfo.start && created < windowInfo.end;
      })
      .map((meal) => ({ ...meal, source: "local" }));
  }

  async function getCurrentUser() {
    if (typeof window.getCurrentUser === "function") {
      try {
        return await window.getCurrentUser();
      } catch {
        // Fall through to direct session lookup.
      }
    }

    if (!window.calbuddySupabase) {
      return null;
    }

    const { data, error } = await window.calbuddySupabase.auth.getSession();
    if (error) return null;
    return data?.session?.user || null;
  }

  async function fetchCloudMeals(windowInfo) {
    const user = await getCurrentUser();

    if (!user || !window.calbuddySupabase) {
      return [];
    }

    const { data, error } = await window.calbuddySupabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", windowInfo.start.toISOString())
      .lt("created_at", windowInfo.end.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("ARI meal ledger cloud read failed; using local fallback.", error.message);
      return [];
    }

    return (data || []).map((meal) => ({ ...meal, source: "supabase" }));
  }

  async function getMealsInWindow(offset = 0) {
    const windowInfo = getCalendarWindow(offset);
    const [cloudMeals, localMeals] = await Promise.all([
      fetchCloudMeals(windowInfo),
      Promise.resolve(localMealsInWindow(windowInfo))
    ]);

    return mergeMeals(cloudMeals, localMeals)
      .sort((a, b) => getMealDate(a) - getMealDate(b));
  }

  function writeConsumedCache(total, windowInfo = getCalendarWindow()) {
    const rounded = Math.max(Math.round(safeNumber(total)), 0);

    localStorage.setItem(CALORIES_KEY, String(rounded));
    localStorage.setItem(CALORIES_DATE_KEY, windowInfo.nutritionDate);
    localStorage.setItem(ACTIVE_DATE_KEY, windowInfo.dateKey);
    localStorage.setItem(
      `calbuddyCaloriesConsumed_${windowInfo.dateKey}`,
      String(rounded)
    );

    return rounded;
  }

  async function syncConsumedCalories() {
    const windowInfo = getCalendarWindow();
    const meals = await getMealsInWindow();
    const total = meals.reduce(
      (sum, meal) => sum + safeNumber(meal?.calories),
      0
    );

    const rounded = writeConsumedCache(total, windowInfo);

    window.dispatchEvent(new CustomEvent("ari:meal-ledger-synced", {
      detail: {
        calories: rounded,
        nutritionDate: windowInfo.nutritionDate,
        mealCount: meals.length
      }
    }));

    return rounded;
  }

  async function getRecentMeals(limit = 12) {
    const user = await getCurrentUser();
    let cloudMeals = [];

    if (user && window.calbuddySupabase) {
      const { data, error } = await window.calbuddySupabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(Math.max(Number(limit) || 12, 1));

      if (!error && data) {
        cloudMeals = data.map((meal) => ({ ...meal, source: "supabase" }));
      }
    }

    return mergeMeals(
      cloudMeals,
      readLocalMeals().map((meal) => ({ ...meal, source: "local" }))
    )
      .sort((a, b) => getMealDate(b) - getMealDate(a))
      .slice(0, Math.max(Number(limit) || 12, 1));
  }

  function saveMealLocally(meal) {
    const meals = readLocalMeals();
    const localMeal = {
      id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...meal,
      source: "local"
    };

    meals.push(localMeal);
    writeLocalMeals(meals);
    return localMeal;
  }

  async function logMeal(meal = {}) {
    const createdAtDate = normalizeMealDate(meal.created_at || new Date());
    const calories = safeNumber(meal.calories);

    if (calories <= 0) {
      throw new Error("Meal calories are required.");
    }

    const record = {
      name: String(meal.name || "Ari meal").trim() || "Ari meal",
      calories,
      category: String(meal.category || "Meal").trim() || "Meal",
      nutrition_date: formatLocalDate(createdAtDate),
      protein_g: safeNumber(meal.protein_g ?? meal.protein),
      carbs_g: safeNumber(meal.carbs_g ?? meal.carbs ?? meal.carbohydrates),
      fat_g: safeNumber(meal.fat_g ?? meal.fat),
      serving_size: String(meal.serving_size || "Added by Ari"),
      multiplier: safeNumber(meal.multiplier, 1) || 1,
      is_favorite: Boolean(meal.is_favorite),
      created_at: createdAtDate.toISOString()
    };

    const user = await getCurrentUser();
    let savedMeal = null;

    window.CalBuddy?.setAriMood?.("logging");

    if (user && window.calbuddySupabase) {
      const { data, error } = await window.calbuddySupabase
        .from("meals")
        .insert({ user_id: user.id, ...record })
        .select("*")
        .single();

      if (!error && data) {
        savedMeal = { ...data, source: "supabase" };
      } else if (error) {
        console.warn("ARI meal ledger cloud save failed; using local fallback.", error.message);
      }
    }

    if (!savedMeal) {
      savedMeal = saveMealLocally(record);
    }

    await syncConsumedCalories();

    window.dispatchEvent(new CustomEvent("calbuddy:mealsChanged", {
      detail: {
        action: "log",
        meal: savedMeal
      }
    }));

    window.CalBuddy?.setAriMood?.("success");

    return savedMeal;
  }

  function persistMidnightResetLocally() {
    localStorage.setItem(
      RESET_TIME_KEY,
      JSON.stringify(MIDNIGHT_RESET)
    );
  }

  async function persistMidnightResetToProfile() {
    const user = await getCurrentUser();
    if (!user || !window.calbuddySupabase) return;

    const { error } = await window.calbuddySupabase
      .from("profiles")
      .update({
        reset_hour: 12,
        reset_minute: 0,
        reset_ampm: "AM",
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) {
      console.warn("ARI midnight reset preference could not be synchronized.", error.message);
    }
  }

  function patchCalBuddy() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy || CalBuddy.__ariMealLedgerSyncV1) return Boolean(CalBuddy);

    const originalClearCalorieCache =
      typeof CalBuddy.clearCalorieCache === "function"
        ? CalBuddy.clearCalorieCache.bind(CalBuddy)
        : null;

    CalBuddy.getResetTime = async function () {
      persistMidnightResetLocally();
      return { ...MIDNIGHT_RESET };
    };

    CalBuddy.getNutritionWindow = async function (offset = 0) {
      return getCalendarWindow(offset);
    };

    CalBuddy.clearCalorieCache = function () {
      originalClearCalorieCache?.();
      localStorage.removeItem(CALORIES_KEY);
      localStorage.removeItem(CALORIES_DATE_KEY);
      localStorage.removeItem(ACTIVE_DATE_KEY);
    };

    CalBuddy.changeResetTime = async function () {
      persistMidnightResetLocally();
      await persistMidnightResetToProfile();
      CalBuddy.clearCalorieCache();
      await syncConsumedCalories();
      return { ...MIDNIGHT_RESET };
    };

    CalBuddy.saveMealLocally = saveMealLocally;
    CalBuddy.logMeal = logMeal;
    CalBuddy.getMealsInWindow = getMealsInWindow;
    CalBuddy.getConsumedCalories = syncConsumedCalories;
    CalBuddy.getRecentMeals = getRecentMeals;

    Object.defineProperty(CalBuddy, "__ariMealLedgerSyncV1", {
      configurable: false,
      enumerable: false,
      value: VERSION
    });

    return true;
  }

  function patchNutritionPage() {
    if (page !== "nutrition.html") return true;
    if (nutritionPatched) return true;

    const ready =
      typeof window.getResetTime === "function" &&
      typeof window.getNutritionWindow === "function" &&
      typeof window.getNutritionDateForTimestamp === "function" &&
      typeof window.saveMealRecord === "function" &&
      typeof window.refreshNutritionPage === "function";

    if (!ready) return false;

    window.getResetTime = async () => ({ ...MIDNIGHT_RESET });
    window.getNutritionWindow = async () => getCalendarWindow();
    window.getNutritionDateForTimestamp = (date) =>
      formatLocalDate(normalizeMealDate(date));

    if (!window.saveMealRecord.__ariCanonicalMealWriter) {
      const originalSaveMealRecord = window.saveMealRecord;

      const canonicalSaveMealRecord = async (record) => {
        if (typeof window.CalBuddy?.logMeal === "function") {
          const meal = await window.CalBuddy.logMeal(record);
          return {
            meal,
            savedToCloud: meal?.source === "supabase"
          };
        }

        return originalSaveMealRecord(record);
      };

      canonicalSaveMealRecord.__ariCanonicalMealWriter = true;
      window.saveMealRecord = canonicalSaveMealRecord;
    }

    nutritionPatched = true;

    Promise.resolve(window.refreshNutritionPage()).catch((error) => {
      console.warn("ARI Nutrition midnight refresh failed.", error);
    });

    return true;
  }

  async function refreshGoalsFromLedger() {
    if (page !== "goals.html") return;

    try {
      await syncConsumedCalories();
    } catch (error) {
      console.warn("ARI Goals meal-ledger sync failed.", error);
    }

    if (typeof window.calculateGoals === "function") {
      window.calculateGoals();
    }
  }

  function patchGoalsPage() {
    if (page !== "goals.html") return true;
    if (goalsPatched) return true;

    const ready =
      typeof window.getActiveNutritionDateKey === "function" &&
      typeof window.calculateGoals === "function";

    if (!ready) return false;

    window.getActiveNutritionDateKey = () =>
      getCalendarWindow().nutritionDate;

    goalsPatched = true;
    void refreshGoalsFromLedger();
    return true;
  }

  function installRuntimePatches() {
    persistMidnightResetLocally();
    const coreReady = patchCalBuddy();
    const nutritionReady = patchNutritionPage();
    const goalsReady = patchGoalsPage();
    return coreReady && nutritionReady && goalsReady;
  }

  installRuntimePatches();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      installRuntimePatches();
      window.setTimeout(installRuntimePatches, 0);
      window.setTimeout(installRuntimePatches, 250);
    }, { once: true });
  } else {
    window.setTimeout(installRuntimePatches, 0);
  }

  let patchAttempts = 0;
  const patchTimer = window.setInterval(() => {
    patchAttempts += 1;
    const complete = installRuntimePatches();

    if (complete || patchAttempts >= 20) {
      window.clearInterval(patchTimer);
    }
  }, 250);

  window.addEventListener("focus", () => {
    if (page === "goals.html") {
      void refreshGoalsFromLedger();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && page === "goals.html") {
      void refreshGoalsFromLedger();
    }
  });

  window.addEventListener("calbuddy:mealsChanged", () => {
    if (page === "nutrition.html" && typeof window.refreshNutritionPage === "function") {
      void window.refreshNutritionPage();
    }

    if (page === "goals.html") {
      void refreshGoalsFromLedger();
    }
  });

  window.AriMealLedgerSync = Object.freeze({
    version: VERSION,
    resetTime: { ...MIDNIGHT_RESET },
    getCalendarWindow,
    getMealsInWindow,
    getRecentMeals,
    syncConsumedCalories,
    logMeal
  });
})();
