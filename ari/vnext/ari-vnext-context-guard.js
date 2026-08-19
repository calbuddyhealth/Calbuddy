// =====================================================
// ARI XP — vNext shared context guard
// Version: 1.0.1
// Purpose:
//   - Give every vNext surface the same canonical nutrition budget contract.
//   - Expose today's active Meal Plan to the model as read-only context.
//   - Treat an unset calorie goal as unknown instead of inventing a fallback.
//   - Recover a small recent conversation window on fresh/reloaded sessions.
//   - Enable the existing bounded GPT-4o-mini peer reflection for Owner Mode.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};
  window.CalBuddy = window.CalBuddy || {};

  const VERSION = "1.0.1";
  const PLAN_LOCAL_KEY = "ariNutritionMealPlanV1";
  const CONTEXT_FLAG = "__ariVNextContextGuardV1";
  const BRIDGE_FLAG = "__ariVNextContinuityGuardV1";
  const PEER_FLAG = "__ariVNextOwnerPeerGuardV1";

  function clean(value = "") {
    return String(value ?? "").trim();
  }

  function finite(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function positive(value) {
    const number = finite(value);
    return number !== null && number > 0 ? number : null;
  }

  function localDateKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function readLocalGoals() {
    try {
      const value = JSON.parse(localStorage.getItem("calbuddyGoals") || "{}");
      return value && typeof value === "object" && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function readLocalPlan() {
    try {
      const value = JSON.parse(localStorage.getItem(PLAN_LOCAL_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function resolveExplicitDailyGoal(context = {}) {
    const localGoals = readLocalGoals();
    const candidates = [
      context?.profile?.daily_calorie_goal,
      localStorage.getItem("calbuddyDailyCalorieGoal"),
      localGoals?.calorieGoal
    ];

    for (const candidate of candidates) {
      const value = positive(candidate);
      if (value !== null) return Math.round(value);
    }

    return null;
  }

  function compactPlan(item = {}) {
    return {
      id: item?.id ?? null,
      plan_date: clean(item?.plan_date),
      meal_slot: clean(item?.meal_slot).toLowerCase(),
      name: clean(item?.name) || "Planned meal",
      calories: Math.max(0, finite(item?.calories) ?? 0),
      protein_g: Math.max(0, finite(item?.protein_g) ?? 0),
      carbs_g: Math.max(0, finite(item?.carbs_g) ?? 0),
      fat_g: Math.max(0, finite(item?.fat_g) ?? 0),
      serving_size: clean(item?.serving_size),
      items: Array.isArray(item?.items) ? item.items.slice(0, 16) : [],
      status: clean(item?.status) || "planned"
    };
  }

  async function readTodayPlannedMeals(context = {}) {
    const dateKey = clean(context?.nutritionDate) || localDateKey();
    const userId = clean(context?.userId);
    const client = window.calbuddySupabase || window.CalBuddy?.supabase;

    if (userId && client?.from) {
      try {
        const { data, error } = await client
          .from("nutrition_plan_items")
          .select("id,plan_date,meal_slot,name,calories,protein_g,carbs_g,fat_g,serving_size,items,status,created_at")
          .eq("user_id", userId)
          .eq("plan_date", dateKey)
          .eq("status", "planned")
          .order("created_at", { ascending: true });

        if (!error && Array.isArray(data)) {
          return data.map(compactPlan);
        }
      } catch (error) {
        console.warn("Ari vNext Meal Plan context read skipped:", error?.message || error);
      }
    }

    return readLocalPlan()
      .filter((item) => clean(item?.plan_date) === dateKey && clean(item?.status || "planned") === "planned")
      .map(compactPlan);
  }

  function mergeHistory(recent = [], current = []) {
    if (typeof window.CalBuddy?.mergeConversationHistory === "function") {
      return window.CalBuddy.mergeConversationHistory(recent, current).slice(-16);
    }

    const merged = [];
    const seen = new Set();
    for (const item of [...recent, ...current]) {
      const role = item?.role === "assistant" ? "assistant" : "user";
      const content = clean(item?.content);
      if (!content) continue;
      const key = `${role}:${content.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push({ role, content });
    }
    return merged.slice(-16);
  }

  function installUserContextGuard() {
    const CalBuddy = window.CalBuddy;
    if (!CalBuddy || CalBuddy[CONTEXT_FLAG]) return Boolean(CalBuddy?.[CONTEXT_FLAG]);
    if (typeof CalBuddy.getUserContext !== "function") return false;

    const originalGetUserContext = CalBuddy.getUserContext.bind(CalBuddy);

    CalBuddy.getUserContext = async function ariVNextCanonicalUserContext() {
      const base = (await originalGetUserContext()) || {};
      const dailyGoal = resolveExplicitDailyGoal(base);
      const consumed = Math.max(0, finite(base?.caloriesConsumed) ?? 0);
      const burned = Math.max(0, finite(base?.caloriesBurned) ?? 0);
      const plannedMeals = await readTodayPlannedMeals(base);
      const plannedCalories = Math.round(
        plannedMeals.reduce((sum, meal) => sum + Math.max(0, finite(meal?.calories) ?? 0), 0)
      );

      const caloriesLeft = dailyGoal === null
        ? null
        : Math.max(0, Math.round(dailyGoal - consumed));
      const caloriesRemainingAfterPlan = dailyGoal === null
        ? null
        : Math.max(0, Math.round(dailyGoal - consumed - plannedCalories));

      const context = {
        ...base,
        dailyGoal,
        caloriesConsumed: consumed,
        caloriesBurned: burned,
        caloriesLeft,
        plannedMeals,
        plannedCalories,
        caloriesRemainingAfterPlan,
        nutrition: {
          ...(base?.nutrition && typeof base.nutrition === "object" ? base.nutrition : {}),
          calorieBudgetPolicy: {
            version: "1.0.0",
            dailyGoalKnown: dailyGoal !== null,
            dailyGoal,
            caloriesConsumed: consumed,
            caloriesBurned: burned,
            caloriesLeft,
            plannedCalories,
            caloriesRemainingAfterPlan,
            formula: "daily_goal_minus_consumed",
            burnedAddsFoodAllowance: false,
            unknownGoalMustRemainUnknown: true
          },
          mealPlan: {
            date: clean(base?.nutritionDate) || localDateKey(),
            todayOnly: true,
            active: plannedMeals,
            activeCount: plannedMeals.length,
            plannedCalories
          }
        }
      };

      if (typeof CalBuddy.buildCoachMemorySummary === "function") {
        context.coachMemorySummary = CalBuddy.buildCoachMemorySummary(context);
      }

      return context;
    };

    Object.defineProperty(CalBuddy, CONTEXT_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI vNext canonical context guard installed:", VERSION);
    return true;
  }

  function installBridgeContinuityGuard() {
    const bridge = window.AriVNextBridge;
    if (!bridge || bridge[BRIDGE_FLAG]) return Boolean(bridge?.[BRIDGE_FLAG]);
    if (typeof bridge.ask !== "function") return false;

    const originalAsk = bridge.ask.bind(bridge);

    bridge.ask = async function ariVNextContinuityAwareAsk(message, options = {}) {
      let history = Array.isArray(options?.history) ? options.history.slice(-16) : [];

      if (history.length < 2 && typeof window.CalBuddy?.loadRecentConversationHistory === "function") {
        try {
          const recent = await window.CalBuddy.loadRecentConversationHistory();
          history = mergeHistory(Array.isArray(recent) ? recent : [], history);
        } catch (error) {
          console.warn("Ari vNext recent continuity recovery skipped:", error?.message || error);
        }
      }

      return await originalAsk(message, {
        ...options,
        history
      });
    };

    Object.defineProperty(bridge, BRIDGE_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI vNext continuity guard installed:", VERSION);
    return true;
  }

  function installOwnerPeerGuard() {
    const bridge = window.AriVNextBridge;
    if (!bridge || bridge[PEER_FLAG]) return Boolean(bridge?.[PEER_FLAG]);
    if (typeof bridge.isPeerReflectionEnabled !== "function") return false;

    const originalIsPeerReflectionEnabled = bridge.isPeerReflectionEnabled.bind(bridge);

    bridge.isPeerReflectionEnabled = function ariVNextOwnerPeerEnabled(options = {}, surface = "") {
      // Explicit opt-out still wins. For everybody else, preserve the existing
      // lab/local preference behavior. Owner Mode gets the bounded peer by
      // default; the server independently verifies owner access before spending.
      if (options?.peerReflectionEnabled === false) return false;
      if (options?.userContext?.ownerMode === true) return true;
      return originalIsPeerReflectionEnabled(options, surface);
    };

    Object.defineProperty(bridge, PEER_FLAG, {
      configurable: false,
      enumerable: false,
      value: true
    });

    console.log("ARI vNext owner peer guard installed:", VERSION);
    return true;
  }

  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    const contextReady = installUserContextGuard();
    const continuityReady = installBridgeContinuityGuard();
    const peerReady = installOwnerPeerGuard();

    if ((contextReady && continuityReady && peerReady) || attempts >= 300) {
      window.clearInterval(timer);
    }
  }, 40);
})();