// =====================================================
// ARI XP
// File: js/ari-nutrition-data-quality.js
// Version: 1.1.0
// Purpose:
//   Add compact data-quality/provenance evidence to the user context Ari sees.
//   All anomaly detection comes from the shared Nutrition validator so Ari and
//   the Nutrition trust UI cannot disagree about the same meal record.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.1.0";
  const INSTALL_FLAG = "__ariNutritionDataQualityV1";
  const VALIDATOR_SCRIPT_ID = "ariNutritionValidatorScript";
  const VALIDATOR_SRC = "js/nutrition-validator.js?v=1.0.0";
  const page = String(window.location.pathname || "")
    .split("/")
    .pop()
    .toLowerCase();

  if (!["", "home.html", "nutrition.html"].includes(page)) return;

  const clean = (value = "") => String(value ?? "").trim();
  const number = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  function ensureValidator() {
    if (typeof window.AriNutritionValidator?.detect === "function") {
      return Promise.resolve(window.AriNutritionValidator);
    }

    return new Promise((resolve, reject) => {
      let script = document.getElementById(VALIDATOR_SCRIPT_ID);

      const finish = () => {
        if (typeof window.AriNutritionValidator?.detect === "function") {
          resolve(window.AriNutritionValidator);
        } else {
          reject(new Error("Shared Nutrition validator did not initialize."));
        }
      };

      if (!script) {
        script = document.createElement("script");
        script.id = VALIDATOR_SCRIPT_ID;
        script.src = VALIDATOR_SRC;
        script.async = false;
        script.addEventListener("load", finish, { once: true });
        script.addEventListener("error", () => reject(new Error("Shared Nutrition validator could not be loaded.")), { once: true });
        document.head.appendChild(script);
        return;
      }

      script.addEventListener("load", finish, { once: true });
      window.setTimeout(finish, 0);
    });
  }

  function detect(entry = {}) {
    return typeof window.AriNutritionValidator?.detect === "function"
      ? window.AriNutritionValidator.detect(entry)
      : [];
  }

  function buildQuality(context = {}) {
    const meals = Array.isArray(context?.mealsToday) ? context.mealsToday : [];
    const warnings = meals
      .map((meal) => {
        const reasons = detect(meal);
        if (!reasons.length) return null;
        return {
          mealId: meal?.id || null,
          name: clean(meal?.name) || "Meal",
          calories: Number.isFinite(Number(meal?.calories)) ? Number(meal.calories) : null,
          servingSize: clean(meal?.serving_size) || null,
          reasons
        };
      })
      .filter(Boolean)
      .slice(0, 8);

    return {
      version: VERSION,
      validatorVersion: window.AriNutritionValidator?.version || null,
      sourceOfTruth: "public.meals",
      nutritionDate: context?.nutritionDate || null,
      loggedMealCount: meals.length,
      loggedCalories: Number.isFinite(Number(context?.caloriesConsumed))
        ? Number(context.caloriesConsumed)
        : meals.reduce((sum, meal) => sum + Math.max(0, number(meal?.calories)), 0),
      warningCount: warnings.length,
      warnings,
      instruction:
        warnings.length
          ? "One or more logged nutrition records look suspicious. Treat those records as uncertain evidence, name the specific inconsistency when relevant, and ask for correction before building precise recommendations on top of them."
          : "No simple nutrition integrity warning was detected in today's logged meals."
    };
  }

  function install() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy || typeof CalBuddy.getUserContext !== "function") return false;
    if (CalBuddy[INSTALL_FLAG]) return true;

    const original = CalBuddy.getUserContext.bind(CalBuddy);

    CalBuddy.getUserContext = async function ariNutritionQualityContext(...args) {
      const context = await original(...args);
      if (!context || typeof context !== "object") return context;

      const quality = buildQuality(context);
      context.nutrition = {
        ...(context.nutrition && typeof context.nutrition === "object" ? context.nutrition : {}),
        ledgerEvidence: {
          source: quality.sourceOfTruth,
          nutritionDate: quality.nutritionDate,
          loggedMealCount: quality.loggedMealCount,
          loggedCalories: quality.loggedCalories
        },
        dataQuality: quality
      };

      return context;
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: VERSION
    });

    console.info(`[ARI Nutrition Data Quality] Ready. Version ${VERSION}.`);
    return true;
  }

  async function boot() {
    try {
      await ensureValidator();
    } catch (error) {
      console.warn("[ARI Nutrition Data Quality] Shared validator unavailable:", error?.message || error);
      return;
    }

    if (install()) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (install() || attempts >= 30) window.clearInterval(timer);
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
