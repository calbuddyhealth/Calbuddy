// =====================================================
// ARI XP
// File: js/nutrition-meal-plan-compact.js
// Version: 1.0.0
// Purpose:
//   Final simplicity pass for the today-only Meal Plan.
//   - Removes duplicate Quick Add Recent shelf.
//   - Keeps Favorites as the only Meal Plan shortcut shelf.
//   - Shows Planned + Remaining calories together.
//   - Adds Favorite / Meal Plan actions to the existing Recent Meals history.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.0.0";
  const LOCAL_MEALS_KEY = "calbuddyMeals";
  const LOCAL_PLAN_KEY = "ariNutritionMealPlanV1";
  let booted = false;
  let recentObserver = null;
  let summaryObserver = null;
  let decorateTimer = null;

  const clean = (value = "") => String(value ?? "").trim();
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const roundMacro = (value) => Math.round(Math.max(0, number(value)) * 10) / 10;

  function todayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function readLocalArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeLocalArray(key, values) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(values) ? values : []));
  }

  function localId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function normalizeSlot(value = "") {
    const text = clean(value).toLowerCase();
    if (/breakfast|morning/.test(text)) return "breakfast";
    if (/lunch|midday/.test(text)) return "lunch";
    if (/dinner|supper|evening/.test(text)) return "dinner";
    if (/snack/.test(text)) return "snack";
    return "";
  }

  function slotLabel(slot = "") {
    const normalized = normalizeSlot(slot) || clean(slot).toLowerCase();
    if (normalized === "breakfast") return "Breakfast";
    if (normalized === "lunch") return "Lunch";
    if (normalized === "dinner") return "Dinner";
    if (normalized === "snack") return "Snack";
    return "Meal";
  }

  function fallbackSlot(meal = {}) {
    const explicit = normalizeSlot(meal.category || meal.meal_slot);
    if (explicit) return explicit;
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour < 20) return "dinner";
    return "snack";
  }

  function readMacro(meal = {}, macro) {
    const keys = macro === "protein"
      ? ["protein_g", "protein"]
      : macro === "carbs"
        ? ["carbs_g", "carbs", "carbohydrates_g", "carbohydrates"]
        : ["fat_g", "fat"];
    for (const key of keys) {
      if (meal[key] !== undefined && meal[key] !== null) return Math.max(0, number(meal[key]));
    }
    return 0;
  }

  function injectStyle() {
    if (document.getElementById("nutritionMealPlanCompactStyle")) return;
    const style = document.createElement("style");
    style.id = "nutritionMealPlanCompactStyle";
    style.textContent = `
      #nutritionTodayMealPlan .nutrition-plan-shelf[aria-labelledby="nutritionRecentPlanHeading"] {
        display: none !important;
      }

      #nutritionTodayMealPlan .nutrition-today-plan-summary {
        min-width: 205px;
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        grid-template-rows: auto auto auto;
        align-items: end;
        column-gap: 14px;
        row-gap: 2px;
        padding: 15px 17px;
      }

      #nutritionTodayPlanPlannedLabel,
      #nutritionTodayPlanRemainingLabel {
        font-family: "Orbitron", sans-serif;
        font-size: 7px;
        font-weight: 800;
        letter-spacing: .12em;
        text-transform: uppercase;
        color: #8695aa;
        white-space: nowrap;
      }

      #nutritionTodayPlanPlannedLabel {
        grid-column: 1;
        grid-row: 1;
      }

      #nutritionTodayPlanRemainingLabel {
        grid-column: 2;
        grid-row: 1;
        text-align: right;
      }

      #nutritionTodayPlanCalories {
        grid-column: 1;
        grid-row: 2;
        text-align: left;
        white-space: nowrap;
      }

      #nutritionTodayPlanRemaining {
        grid-column: 2;
        grid-row: 2;
        color: #315de8;
        font-size: 18px;
        font-weight: 900;
        line-height: 1.1;
        text-align: right;
        white-space: nowrap;
      }

      #nutritionTodayPlanSummaryText {
        grid-column: 1 / -1;
        grid-row: 3;
        margin-top: 5px;
        text-align: right;
      }

      .nutrition-recent-plan-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        width: 100%;
      }

      .nutrition-recent-plan-actions button {
        min-height: 38px;
        border-radius: 12px;
        border: 1px solid rgba(57, 100, 172, .14);
        background: rgba(246, 250, 255, .94);
        color: #31558f;
        font-family: "Orbitron", sans-serif;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: .06em;
        text-transform: uppercase;
        cursor: pointer;
      }

      .nutrition-recent-plan-actions .nutrition-recent-favorite-btn {
        width: 42px;
        flex: 0 0 42px;
        padding: 0;
        font-size: 17px;
        color: #6c7f9a;
      }

      .nutrition-recent-plan-actions .nutrition-recent-favorite-btn.is-favorite {
        color: #315de8;
        background: #f2f6ff;
      }

      .nutrition-recent-plan-actions .nutrition-recent-add-plan-btn {
        flex: 1 1 auto;
        padding: 0 12px;
        color: #244fc2;
        background: linear-gradient(145deg, #f6f9ff, #edf4ff);
      }

      @media (max-width: 520px) {
        #nutritionTodayMealPlan .nutrition-today-plan-summary {
          min-width: 188px;
          column-gap: 10px;
          padding: 13px 14px;
        }

        #nutritionTodayPlanRemaining {
          font-size: 16px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function removeDuplicateRecentShelf() {
    const heading = document.getElementById("nutritionRecentPlanHeading");
    const section = heading?.closest(".nutrition-plan-shelf");
    if (section) section.remove();
  }

  function decorateSummary() {
    const summary = document.querySelector("#nutritionTodayMealPlan .nutrition-today-plan-summary");
    const planned = document.getElementById("nutritionTodayPlanCalories");
    const status = document.getElementById("nutritionTodayPlanSummaryText");
    if (!summary || !planned || !status) return false;

    if (!document.getElementById("nutritionTodayPlanPlannedLabel")) {
      const label = document.createElement("span");
      label.id = "nutritionTodayPlanPlannedLabel";
      label.textContent = "Planned";
      summary.insertBefore(label, planned);
    }

    if (!document.getElementById("nutritionTodayPlanRemainingLabel")) {
      const label = document.createElement("span");
      label.id = "nutritionTodayPlanRemainingLabel";
      label.textContent = "Remaining";
      summary.insertBefore(label, status);
    }

    if (!document.getElementById("nutritionTodayPlanRemaining")) {
      const remaining = document.createElement("strong");
      remaining.id = "nutritionTodayPlanRemaining";
      remaining.textContent = "—";
      summary.insertBefore(remaining, status);
    }

    updateRemainingCalories();
    return true;
  }

  function updateRemainingCalories() {
    const output = document.getElementById("nutritionTodayPlanRemaining");
    if (!output) return;

    const context = window.AriNutritionMealPlanner?.getAriContext?.() || {};
    const goal = Math.max(0, number(context.calorieGoal));
    const consumed = Math.max(0, number(context.consumedCalories));
    const planned = Math.max(0, number(context.plannedCalories));

    if (!goal) {
      output.textContent = "—";
      output.title = "Set a daily calorie goal to see remaining calories.";
      return;
    }

    const remaining = Math.round(goal - consumed - planned);
    output.textContent = remaining >= 0
      ? `${remaining.toLocaleString()} kcal`
      : `${Math.abs(remaining).toLocaleString()} over`;
    output.title = `${Math.round(goal).toLocaleString()} goal − ${Math.round(consumed).toLocaleString()} eaten − ${Math.round(planned).toLocaleString()} planned`;
  }

  async function getUser() {
    try {
      if (typeof window.getCurrentUser === "function") return await window.getCurrentUser();
      if (typeof window.CalBuddy?.getCurrentUser === "function") return await window.CalBuddy.getCurrentUser();
      if (window.calbuddySupabase?.auth?.getUser) {
        const { data } = await window.calbuddySupabase.auth.getUser();
        return data?.user || null;
      }
    } catch (error) {
      console.warn("[Meal Plan Compact] User lookup failed:", error?.message || error);
    }
    return null;
  }

  function showToast(message) {
    document.getElementById("nutritionMealPlanCompactToast")?.remove();
    const toast = document.createElement("div");
    toast.id = "nutritionMealPlanCompactToast";
    toast.setAttribute("role", "status");
    toast.textContent = clean(message);
    Object.assign(toast.style, {
      position: "fixed",
      left: "50%",
      bottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
      transform: "translateX(-50%)",
      zIndex: "9999",
      maxWidth: "calc(100vw - 34px)",
      padding: "11px 15px",
      borderRadius: "14px",
      background: "rgba(19, 42, 78, .94)",
      color: "white",
      fontSize: "13px",
      fontWeight: "700",
      boxShadow: "0 12px 30px rgba(15, 37, 72, .2)"
    });
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2200);
  }

  async function toggleFavorite(meal, button) {
    const currentlyFavorite = meal.is_favorite === true;
    const next = !currentlyFavorite;
    const previousText = button.textContent;
    button.disabled = true;

    try {
      const user = await getUser();
      if (meal.source === "supabase" && user?.id && window.calbuddySupabase) {
        const { error } = await window.calbuddySupabase
          .from("meals")
          .update({ is_favorite: next })
          .eq("id", meal.id)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const local = readLocalArray(LOCAL_MEALS_KEY);
        const index = local.findIndex((item) => String(item.id) === String(meal.id));
        if (index >= 0) {
          local[index] = { ...local[index], is_favorite: next };
          writeLocalArray(LOCAL_MEALS_KEY, local);
        }
      }

      meal.is_favorite = next;
      showToast(next ? `${meal.name || "Meal"} added to Favorites.` : `${meal.name || "Meal"} removed from Favorites.`);
      await refreshSources();
    } catch (error) {
      console.error("[Meal Plan Compact] Favorite update failed:", error);
      button.textContent = previousText;
      showToast("Favorite could not be updated.");
    } finally {
      button.disabled = false;
    }
  }

  async function addRecentMealToPlan(meal, button) {
    const slot = fallbackSlot(meal);
    const plannerState = window.AriNutritionMealPlanner?.getState?.() || {};
    const existing = (plannerState.plans || []).some((plan) => normalizeSlot(plan.meal_slot) === slot);

    if (existing) {
      showToast(`${slotLabel(slot)} already has an active plan today.`);
      return;
    }

    const record = {
      plan_date: todayKey(),
      meal_slot: slot,
      name: clean(meal.name) || "Meal",
      calories: Math.max(0, Math.round(number(meal.calories))),
      protein_g: roundMacro(readMacro(meal, "protein")),
      carbs_g: roundMacro(readMacro(meal, "carbs")),
      fat_g: roundMacro(readMacro(meal, "fat")),
      serving_size: clean(meal.serving_size) || "Recent meal",
      multiplier: Math.max(.01, number(meal.multiplier, 1) || 1),
      source_type: "recent",
      source_ref: clean(meal.id) || null,
      recipe_id: null,
      items: [],
      notes: "Added from Recent Meals",
      status: "planned",
      position: 0,
      updated_at: new Date().toISOString()
    };

    const previous = button.textContent;
    button.disabled = true;
    button.textContent = "Adding…";

    try {
      const user = await getUser();
      let saved = null;

      if (user?.id && window.calbuddySupabase) {
        const { data, error } = await window.calbuddySupabase
          .from("nutrition_plan_items")
          .insert({ user_id: user.id, ...record })
          .select("*")
          .single();
        if (!error && data) saved = data;
        else if (error) console.warn("[Meal Plan Compact] Cloud plan save failed; using local fallback:", error.message);
      }

      if (!saved) {
        saved = { id: localId("plan"), ...record, created_at: new Date().toISOString(), storage_source: "local" };
        const local = readLocalArray(LOCAL_PLAN_KEY);
        local.push(saved);
        writeLocalArray(LOCAL_PLAN_KEY, local);
      }

      window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", {
        detail: { action: "recent_added", payload: saved, date: todayKey(), version: VERSION }
      }));
      showToast(`${record.name} added to today's ${slotLabel(slot).toLowerCase()}.`);
      await window.AriNutritionMealPlanner?.refresh?.();
      updateRemainingCalories();
    } catch (error) {
      console.error("[Meal Plan Compact] Recent-to-plan add failed:", error);
      showToast("That meal could not be added to Meal Plan.");
    } finally {
      button.disabled = false;
      button.textContent = previous;
    }
  }

  function decorateRecentMeals() {
    const container = document.getElementById("recentMealList") || document.getElementById("recentMealsList");
    const recentMeals = window.AriNutritionPage?.getState?.()?.recentMeals || [];
    if (!container || !recentMeals.length) return;

    const cards = Array.from(container.querySelectorAll(":scope > .nutrition-recent-meal"));
    cards.forEach((card, index) => {
      const meal = recentMeals[index];
      if (!meal) return;

      let actions = card.querySelector(":scope > .nutrition-recent-plan-actions");
      if (!actions) {
        actions = document.createElement("div");
        actions.className = "nutrition-recent-plan-actions";
        card.appendChild(actions);
      }

      actions.replaceChildren();

      const favorite = document.createElement("button");
      favorite.type = "button";
      favorite.className = `nutrition-recent-favorite-btn${meal.is_favorite === true ? " is-favorite" : ""}`;
      favorite.textContent = meal.is_favorite === true ? "★" : "☆";
      favorite.setAttribute("aria-label", meal.is_favorite === true ? "Remove from Favorites" : "Add to Favorites");
      favorite.addEventListener("click", () => void toggleFavorite(meal, favorite));

      const add = document.createElement("button");
      add.type = "button";
      add.className = "nutrition-recent-add-plan-btn";
      add.textContent = `+ Add to ${slotLabel(fallbackSlot(meal))}`;
      add.addEventListener("click", () => void addRecentMealToPlan(meal, add));

      actions.append(favorite, add);
    });
  }

  async function refreshSources() {
    try {
      await window.AriNutritionPage?.refresh?.();
    } catch {}
    try {
      await window.AriNutritionMealPlanner?.refresh?.();
    } catch {}
    scheduleDecorate();
  }

  function scheduleDecorate() {
    window.clearTimeout(decorateTimer);
    decorateTimer = window.setTimeout(() => {
      removeDuplicateRecentShelf();
      decorateSummary();
      decorateRecentMeals();
      updateRemainingCalories();
    }, 40);
  }

  function observePage() {
    const recent = document.getElementById("recentMealList") || document.getElementById("recentMealsList");
    if (recent && !recentObserver && "MutationObserver" in window) {
      recentObserver = new MutationObserver(scheduleDecorate);
      recentObserver.observe(recent, { childList: true });
    }

    const planned = document.getElementById("nutritionTodayPlanCalories");
    if (planned && !summaryObserver && "MutationObserver" in window) {
      summaryObserver = new MutationObserver(updateRemainingCalories);
      summaryObserver.observe(planned, { childList: true, characterData: true, subtree: true });
    }
  }

  function bindEvents() {
    window.addEventListener("ari:nutritionMealPlanChanged", scheduleDecorate);
    window.addEventListener("ari:mealLogged", scheduleDecorate);
    window.addEventListener("calbuddy:dashboardRefresh", scheduleDecorate);
    window.addEventListener("storage", (event) => {
      if (["calbuddyDailyCalorieGoal", "calbuddyCaloriesConsumed", "calbuddyCaloriesConsumedDate"].includes(event.key)) {
        updateRemainingCalories();
      }
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest('#nutritionTodayModeTabs [data-mode="plan"]')) {
        window.setTimeout(scheduleDecorate, 90);
      }
    });
  }

  function boot() {
    if (booted) return;
    if (!document.getElementById("manualEntrySection")) return;
    booted = true;
    injectStyle();
    bindEvents();

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      const ready = Boolean(
        window.AriNutritionMealPlanner &&
        document.getElementById("nutritionTodayMealPlan")
      );

      if (ready) {
        window.clearInterval(timer);
        removeDuplicateRecentShelf();
        decorateSummary();
        decorateRecentMeals();
        observePage();
        updateRemainingCalories();
        console.info(`[ARI Meal Plan Compact] Ready. Version ${VERSION}.`);
      } else if (attempts >= 160) {
        window.clearInterval(timer);
      }
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
