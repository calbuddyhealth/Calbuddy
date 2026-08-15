// =====================================================
// ARI EXPERIENCE
// File: ari/actions/ari-meal-action.js
// Version: 2.0.0
// Purpose:
//   SINGLE executor/proposer for Ari-created meal-log mutations.
//   Command meaning comes ONLY from the central OpenAI intent router.
//   Nutrition details come only from the CURRENT turn.
// =====================================================

(() => {
  "use strict";

  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "2.0.0";
  const INSTALL_FLAG = "__ariMealActionV2";
  const SOURCE = "ari_meal_action_v2_central_router";

  const clean = (value = "") => String(value ?? "").trim();

  function isMealDecision(decision = {}) {
    return (
      clean(decision.domain) === "nutrition" &&
      clean(decision.target) === "meal" &&
      clean(decision.action) === "log_meal" &&
      decision.needs_clarification !== true &&
      Number(decision.confidence || 0) >= 0.8
    );
  }

  function normalizeMealTitle(estimate = {}, decision = {}, message = "") {
    const foods = Array.isArray(estimate.foods)
      ? estimate.foods.map(item => clean(item?.name)).filter(Boolean)
      : [];

    let title = clean(estimate.description);

    if (!title) {
      title = clean(decision?.entities?.food_description);
    }

    if (!title && foods.length) {
      title = foods.slice(0, 4).join(" + ");
    }

    if (!title) title = clean(message);

    // Title cleanup is presentation-only. It is NOT used to decide whether
    // the request is a meal action; the central router already decided that.
    title = title
      .replace(/^\s*(?:hey\s+ari[,\s]+)?/i, "")
      .replace(/^\s*(?:(?:can|could|would)\s+you\s+|please\s+)?(?:log|track|save|record|add)\s+/i, "")
      .replace(/^\s*(?:i\s+(?:had|ate|drank|just\s+had|just\s+ate|just\s+drank))\s+/i, "")
      .replace(/\b(?:can|could|would)\s+you\s+(?:please\s+)?(?:log|track|save|record|add)\b.*$/i, "")
      .replace(/\b(?:log|track|save|record|add)\s+(?:that|this|it)(?:\s+meal)?\b.*$/i, "")
      .replace(/[.?!,:;\-\s]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (!title && foods.length) title = foods.slice(0, 4).join(" + ");
    if (!title) title = "Meal";
    if (title.length > 72 && foods.length) title = foods.slice(0, 4).join(" + ");
    if (title.length > 72) title = `${title.slice(0, 69).trim()}...`;

    return title.charAt(0).toUpperCase() + title.slice(1);
  }

  function normalizeEstimate(raw = {}, decision = {}, message = "") {
    const calories = Number(raw.totalCalories ?? raw.calories ?? 0);
    const protein = Number(raw.protein_g);
    const carbs = Number(raw.carbs_g);
    const fat = Number(raw.fat_g);

    if (!Number.isFinite(calories) || calories <= 0) return null;
    if (![protein, carbs, fat].every(Number.isFinite)) return null;

    return {
      name: normalizeMealTitle(raw, decision, message),
      calories: Math.round(calories),
      protein_g: Math.max(0, Math.round(protein * 10) / 10),
      carbs_g: Math.max(0, Math.round(carbs * 10) / 10),
      fat_g: Math.max(0, Math.round(fat * 10) / 10),
      category: clean(decision?.entities?.meal_category) || "Meal",
      serving_size: "Estimated by Ari before logging",
      estimate_confidence: clean(raw.confidence) || "medium",
      source: SOURCE
    };
  }

  function extractStructuredEstimate(result = {}) {
    return (
      result?.mealEstimate ||
      result?.nutritionEstimate ||
      result?.response?.mealEstimate ||
      result?.response?.nutritionEstimate ||
      null
    );
  }

  async function requestCurrentTurnEstimate(message = "", decision = {}) {
    const entityDescription = clean(decision?.entities?.food_description);

    const response = await fetch("/api/ask-calbuddy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: clean(message),
        history: [],
        responseFormat: "json",
        aiInstruction:
          "This is a meal-log nutrition estimation transaction. Use ONLY the CURRENT user message and the current router entities. " +
          `Router food description: ${entityDescription || "not supplied"}. ` +
          "Identify only the foods/drinks the user is asking to log. Return mealEstimate with description, totalCalories, protein_g, carbs_g, fat_g, foods, and confidence. " +
          "Do not say anything was logged or saved. The app will require confirmation before writing."
      })
    });

    if (!response.ok) throw new Error("Meal estimate request failed.");

    const data = await response.json();
    return { result: data, structured: extractStructuredEstimate(data) };
  }

  function clearOldMealPendingAction(CalBuddy) {
    try {
      const pending = CalBuddy.getPendingAction?.();
      if (pending?.action_type === "log_meal") {
        CalBuddy.cancelPendingAction?.();
      }
    } catch {
      // Best-effort stale-state cleanup only.
    }
  }

  async function createPendingMeal(CalBuddy, estimate, decision) {
    const action = {
      action_type: "log_meal",
      source: SOURCE,
      payload: {
        ...estimate,
        intent_router: {
          domain: decision.domain,
          intent: decision.intent,
          target: decision.target,
          action: decision.action,
          confidence: decision.confidence,
          router_version: decision.router_version || null
        }
      },
      confirmation_text:
        `Log ${estimate.name} — about ${estimate.calories.toLocaleString()} kcal · ` +
        `${estimate.protein_g}g protein · ${estimate.carbs_g}g carbs · ${estimate.fat_g}g fat?`
    };

    const pending = await CalBuddy.createPendingAction(action);
    CalBuddy.setAriMood?.("coach");
    return pending;
  }

  function install() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy?._askAriInternal || !CalBuddy?.createPendingAction) return false;
    if (CalBuddy[INSTALL_FLAG]) return true;

    const originalInternal = CalBuddy._askAriInternal.bind(CalBuddy);

    CalBuddy._askAriInternal = async function ariMealActionRouter(args = {}) {
      const message = clean(args.message);
      const decision = args.intentDecision || null;

      if (!isMealDecision(decision)) {
        return await originalInternal(args);
      }

      clearOldMealPendingAction(CalBuddy);

      let result = await originalInternal(args);
      if (result?.blocked) return result;

      let structured = extractStructuredEstimate(result);
      let estimate = normalizeEstimate(structured || {}, decision, message);

      if (!estimate) {
        try {
          const fallback = await requestCurrentTurnEstimate(message, decision);
          result = fallback.result || result;
          structured = fallback.structured;
          estimate = normalizeEstimate(structured || {}, decision, message);
        } catch (error) {
          console.warn("ARI meal estimate fallback failed:", error?.message || error);
        }
      }

      if (!estimate) {
        return {
          ...(result || {}),
          pendingAction: null,
          reply: "I understand that you want to log a meal, but I need a clearer food or serving description before I can estimate the calories and macros safely.",
          intentDecision: decision,
          source: "ari-meal-action-estimate-incomplete"
        };
      }

      const pending = await createPendingMeal(CalBuddy, estimate, decision);

      // Transaction truth always overrides conversational wording. Until YES,
      // Ari may say only that the meal is ready to confirm — never "logged".
      return {
        ...(result || {}),
        reply: pending.confirmation_text,
        mealEstimate: structured,
        pendingAction: pending,
        intentDecision: decision,
        source: SOURCE
      };
    };

    Object.defineProperty(CalBuddy, INSTALL_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI MEAL ACTION INSTALLED:", VERSION);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (install() || attempts >= 240) window.clearInterval(timer);
  }, 50);
})();
