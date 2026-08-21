// =====================================================
// ARI XP
// File: js/nutrition-meal-plan-today.js
// Version: 2.1.0
// Purpose:
//   Today-only Meal Plan controller for Nutrition.
//   - One Meal Plan controller; no post-render compact patch.
//   - Favorites are the only shortcut shelf inside Meal Plan.
//   - Existing Recent Meals history gets Favorite / Add-to-Plan actions.
//   - Planned and Remaining calories share one summary.
//   - Quick-meal data is loaded only when Meal Plan is opened.
// =====================================================

(() => {
  "use strict";

  const VERSION = "2.1.0";
  const PLAN_LOCAL_KEY = "ariNutritionMealPlanV1";
  const LOCAL_MEALS_KEY = "calbuddyMeals";
  const DAILY_GOAL_KEY = "calbuddyDailyCalorieGoal";
  const CONSUMED_KEY = "calbuddyCaloriesConsumed";
  const CONSUMED_DATE_KEY = "calbuddyCaloriesConsumedDate";
  const SLOT_ORDER = ["breakfast", "lunch", "dinner", "snack"];

  const state = {
    mode: "log",
    user: null,
    plans: [],
    favorites: [],
    plansLoaded: false,
    favoritesLoaded: false,
    busy: false,
    discardTimer: null,
    recentDecorateTimer: null
  };

  const els = {};

  const clean = (value = "") => String(value ?? "").trim();
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const roundMacro = (value) => Math.round(Math.max(0, number(value)) * 10) / 10;

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function todayKey() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function todayLabel() {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    }).format(new Date());
  }

  function normalizeSlot(value = "") {
    const text = clean(value).toLowerCase();
    if (/breakfast|morning/.test(text)) return "breakfast";
    if (/lunch|midday/.test(text)) return "lunch";
    if (/dinner|supper|evening/.test(text)) return "dinner";
    if (/snack/.test(text)) return "snack";
    return "";
  }

  function slotLabel(value = "") {
    const slot = normalizeSlot(value) || clean(value).toLowerCase();
    if (slot === "breakfast") return "Breakfast";
    if (slot === "lunch") return "Lunch";
    if (slot === "dinner") return "Dinner";
    if (slot === "snack") return "Snack";
    return "Meal";
  }

  function fallbackSlotForMeal(meal = {}) {
    const category = normalizeSlot(meal.category || meal.meal_slot);
    if (category) return category;

    const created = new Date(meal.created_at || meal.createdAt || Date.now());
    const hour = Number.isNaN(created.getTime()) ? new Date().getHours() : created.getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour < 20) return "dinner";
    return "snack";
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

  function readMealMacro(meal, macro) {
    const keys = macro === "protein"
      ? ["protein_g", "protein"]
      : macro === "carbs"
        ? ["carbs_g", "carbs", "carbohydrates_g", "carbohydrates"]
        : ["fat_g", "fat"];

    for (const key of keys) {
      if (meal?.[key] !== undefined && meal?.[key] !== null) {
        return Math.max(0, number(meal[key]));
      }
    }
    return 0;
  }

  function normalizeComponents(items = [], plan = null) {
    const source = Array.isArray(items) ? items : [];
    const normalized = source
      .map((item, index) => {
        const name = clean(item?.name);
        if (!name) return null;
        return {
          id: clean(item?.id) || `component-${index}`,
          name,
          amount: clean(item?.amount || item?.serving_size),
          calories: Math.max(0, number(item?.calories)),
          protein_g: Math.max(0, roundMacro(item?.protein_g)),
          carbs_g: Math.max(0, roundMacro(item?.carbs_g)),
          fat_g: Math.max(0, roundMacro(item?.fat_g))
        };
      })
      .filter(Boolean);

    if (normalized.length) return normalized;
    if (!plan) return [];

    return [{
      id: "whole-meal",
      name: clean(plan.name) || "Meal",
      amount: clean(plan.serving_size),
      calories: Math.max(0, number(plan.calories)),
      protein_g: Math.max(0, roundMacro(plan.protein_g)),
      carbs_g: Math.max(0, roundMacro(plan.carbs_g)),
      fat_g: Math.max(0, roundMacro(plan.fat_g))
    }];
  }

  function sumComponents(items = []) {
    return items.reduce((sum, item) => {
      sum.calories += Math.max(0, number(item.calories));
      sum.protein_g += Math.max(0, number(item.protein_g));
      sum.carbs_g += Math.max(0, number(item.carbs_g));
      sum.fat_g += Math.max(0, number(item.fat_g));
      return sum;
    }, { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 });
  }

  function dedupeMeals(meals = []) {
    const seen = new Set();
    const output = [];

    for (const meal of meals) {
      if (!meal) continue;
      const key = clean(meal.id) || `${clean(meal.name).toLowerCase()}|${Math.round(number(meal.calories))}|${clean(meal.category).toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      output.push(meal);
    }

    return output;
  }

  async function getUser() {
    if (state.user?.id) return state.user;

    try {
      if (typeof window.getCurrentUser === "function") {
        state.user = await window.getCurrentUser();
      } else if (typeof window.CalBuddy?.getCurrentUser === "function") {
        state.user = await window.CalBuddy.getCurrentUser();
      } else if (window.calbuddySupabase?.auth?.getUser) {
        const { data } = await window.calbuddySupabase.auth.getUser();
        state.user = data?.user || null;
      }
    } catch (error) {
      console.warn("[ARI Today Meal Plan] User lookup failed:", error?.message || error);
    }

    return state.user;
  }

  function injectCss() {
    if (!document.getElementById("ariNutritionTodayMealPlanCss")) {
      const link = document.createElement("link");
      link.id = "ariNutritionTodayMealPlanCss";
      link.rel = "stylesheet";
      link.href = "assets/css/nutrition-meal-plan-today.css?v=2.0.0";
      document.head.appendChild(link);
    }

    if (document.getElementById("ariNutritionTodayIntegratedStyle")) return;
    const style = document.createElement("style");
    style.id = "ariNutritionTodayIntegratedStyle";
    style.textContent = `
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

      #nutritionTodayPlanPlannedLabel { grid-column: 1; grid-row: 1; }
      #nutritionTodayPlanRemainingLabel { grid-column: 2; grid-row: 1; text-align: right; }
      #nutritionTodayPlanCalories { grid-column: 1; grid-row: 2; text-align: left; white-space: nowrap; }
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
        #nutritionTodayPlanRemaining { font-size: 16px; }
      }
    `;
    document.head.appendChild(style);
  }

  function cacheElements() {
    els.section = document.getElementById("manualEntrySection");
    els.header = els.section?.querySelector(":scope > .ari-manual-header") || null;
    els.form = els.section?.querySelector(":scope > .ari-form") || null;
  }

  function buildTabs() {
    if (!els.section || document.getElementById("nutritionTodayModeTabs")) return;

    const tabs = document.createElement("div");
    tabs.id = "nutritionTodayModeTabs";
    tabs.className = "nutrition-today-mode-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Nutrition mode");
    tabs.innerHTML = `
      <button type="button" role="tab" data-mode="log" aria-selected="true">Log Meal</button>
      <button type="button" role="tab" data-mode="plan" aria-selected="false">Meal Plan <span class="nutrition-plan-tab-count" id="nutritionTodayPlanCount">0</span></button>
    `;

    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-mode]");
      if (!button) return;
      setMode(button.dataset.mode);
    });

    els.section.insertBefore(tabs, els.section.firstChild);
    els.tabs = tabs;
    els.count = tabs.querySelector("#nutritionTodayPlanCount");
  }

  function buildPlanPane() {
    if (!els.section || document.getElementById("nutritionTodayMealPlan")) return;

    const pane = document.createElement("section");
    pane.id = "nutritionTodayMealPlan";
    pane.className = "nutrition-today-plan";
    pane.hidden = true;
    pane.setAttribute("role", "tabpanel");
    pane.setAttribute("aria-label", "Today's meal plan");
    pane.innerHTML = `
      <div class="nutrition-today-plan-hero">
        <div class="nutrition-today-plan-hero__top">
          <div>
            <span class="nutrition-today-plan-kicker">Today only</span>
            <h3>Meal Plan</h3>
            <p class="nutrition-today-plan-date" id="nutritionTodayPlanDate"></p>
          </div>
          <div class="nutrition-today-plan-summary">
            <span id="nutritionTodayPlanPlannedLabel">Planned</span>
            <span id="nutritionTodayPlanRemainingLabel">Remaining</span>
            <strong id="nutritionTodayPlanCalories">0 kcal</strong>
            <strong id="nutritionTodayPlanRemaining">—</strong>
            <span id="nutritionTodayPlanSummaryText">Nothing planned</span>
          </div>
        </div>
      </div>

      <div class="nutrition-today-plan-list" id="nutritionTodayPlanList"></div>

      <section class="nutrition-plan-shelf" aria-labelledby="nutritionFavoritesHeading">
        <div class="nutrition-plan-shelf-heading">
          <div>
            <span>Quick add</span>
            <h4 id="nutritionFavoritesHeading">Favorites</h4>
          </div>
          <p>Swipe to browse</p>
        </div>
        <div class="nutrition-plan-shelf-track" id="nutritionFavoriteShelf"></div>
      </section>
    `;

    const anchor = els.header || els.form;
    if (anchor) els.section.insertBefore(pane, anchor);
    else els.section.appendChild(pane);

    els.pane = pane;
    els.date = pane.querySelector("#nutritionTodayPlanDate");
    els.calories = pane.querySelector("#nutritionTodayPlanCalories");
    els.remaining = pane.querySelector("#nutritionTodayPlanRemaining");
    els.summary = pane.querySelector("#nutritionTodayPlanSummaryText");
    els.planList = pane.querySelector("#nutritionTodayPlanList");
    els.favoriteShelf = pane.querySelector("#nutritionFavoriteShelf");

    pane.addEventListener("click", handlePlanPaneClick);
  }

  async function setMode(mode = "log") {
    state.mode = mode === "plan" ? "plan" : "log";
    const isPlan = state.mode === "plan";
    els.section?.classList.toggle("is-today-plan-mode", isPlan);
    if (els.pane) els.pane.hidden = !isPlan;

    els.tabs?.querySelectorAll("[data-mode]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.mode === state.mode));
    });

    if (isPlan) await refresh({ includeFavorites: true });
  }

  async function loadPlans() {
    const user = await getUser();
    const client = window.calbuddySupabase;
    const date = todayKey();

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_plan_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_date", date)
        .eq("status", "planned")
        .order("meal_slot", { ascending: true })
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error) {
        state.plans = (data || []).map((item) => ({ ...item, storage_source: "supabase" }));
        state.plansLoaded = true;
        return state.plans;
      }

      console.warn("[ARI Today Meal Plan] Cloud plan load failed:", error.message);
    }

    state.plans = readLocalArray(PLAN_LOCAL_KEY)
      .filter((item) => item.plan_date === date && item.status === "planned")
      .map((item) => ({ ...item, storage_source: "local" }));
    state.plansLoaded = true;
    return state.plans;
  }

  async function loadFavorites() {
    const user = await getUser();
    const client = window.calbuddySupabase;

    if (user?.id && client) {
      const { data, error } = await client
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_favorite", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!error) {
        state.favorites = dedupeMeals((data || []).map((meal) => ({ ...meal, storage_source: "supabase", source: "supabase" })));
        state.favoritesLoaded = true;
        return state.favorites;
      }

      console.warn("[ARI Today Meal Plan] Favorite meal load failed:", error.message);
    }

    const local = readLocalArray(LOCAL_MEALS_KEY)
      .filter((meal) => meal.is_favorite === true)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .map((meal) => ({ ...meal, storage_source: "local", source: "local" }));

    state.favorites = dedupeMeals(local).slice(0, 20);
    state.favoritesLoaded = true;
    return state.favorites;
  }

  function sortPlans(plans = []) {
    return [...plans].sort((a, b) => {
      const aSlot = SLOT_ORDER.indexOf(normalizeSlot(a.meal_slot));
      const bSlot = SLOT_ORDER.indexOf(normalizeSlot(b.meal_slot));
      if (aSlot !== bSlot) return aSlot - bSlot;
      return number(a.position) - number(b.position);
    });
  }

  function dailyGoal() {
    return Math.max(0, number(localStorage.getItem(DAILY_GOAL_KEY)));
  }

  function consumedToday() {
    return clean(localStorage.getItem(CONSUMED_DATE_KEY)) === todayKey()
      ? Math.max(0, number(localStorage.getItem(CONSUMED_KEY)))
      : 0;
  }

  function updateRemainingCalories() {
    if (!els.remaining) return;

    const goal = dailyGoal();
    const consumed = consumedToday();
    const planned = state.plans.reduce((sum, plan) => sum + Math.max(0, number(plan.calories)), 0);

    if (!goal) {
      els.remaining.textContent = "—";
      els.remaining.title = "Set a daily calorie goal to see remaining calories.";
      return;
    }

    const remaining = Math.round(goal - consumed - planned);
    els.remaining.textContent = remaining >= 0
      ? `${remaining.toLocaleString()} kcal`
      : `${Math.abs(remaining).toLocaleString()} over`;
    els.remaining.title = `${Math.round(goal).toLocaleString()} goal − ${Math.round(consumed).toLocaleString()} eaten − ${Math.round(planned).toLocaleString()} planned`;
  }

  function render() {
    if (!els.pane) return;

    if (els.date) els.date.textContent = todayLabel();
    if (els.count) els.count.textContent = String(state.plans.length);

    const plannedCalories = state.plans.reduce((sum, plan) => sum + Math.max(0, number(plan.calories)), 0);
    if (els.calories) els.calories.textContent = `${Math.round(plannedCalories).toLocaleString()} kcal`;
    if (els.summary) {
      els.summary.textContent = state.plans.length
        ? `${state.plans.length} active ${state.plans.length === 1 ? "plan" : "plans"}`
        : "Nothing planned";
    }

    updateRemainingCalories();
    renderPlanCards();
    renderFavoriteShelf();
    scheduleRecentDecoration();
  }

  function renderPlanCards() {
    if (!els.planList) return;
    els.planList.replaceChildren();

    const plans = sortPlans(state.plans);
    if (!plans.length) {
      const empty = document.createElement("div");
      empty.className = "nutrition-plan-empty";
      empty.innerHTML = `
        <strong>No meal plans saved for today.</strong>
        <p>Meal plans you approve from Ari will appear here. Nothing is counted as eaten until you log it.</p>
      `;
      els.planList.appendChild(empty);
      return;
    }

    plans.forEach((plan) => els.planList.appendChild(buildPlanCard(plan)));
  }

  function buildPlanCard(plan) {
    const card = document.createElement("article");
    card.className = "nutrition-today-plan-card";
    card.dataset.planId = clean(plan.id);

    const components = normalizeComponents(plan.items, plan);
    const preview = components
      .slice(0, 5)
      .map((item) => `${escapeHtml(item.name)}${item.amount ? ` · ${escapeHtml(item.amount)}` : ""}`)
      .join("<br>");

    const selectable = components.length > 1 || (components.length === 1 && components[0].id !== "whole-meal");

    card.innerHTML = `
      <div class="nutrition-plan-card-top">
        <div>
          <span class="nutrition-plan-slot-chip">${escapeHtml(slotLabel(plan.meal_slot))}</span>
          <h4 class="nutrition-plan-card-name">${escapeHtml(plan.name || "Meal")}</h4>
        </div>
        <strong class="nutrition-plan-card-kcal">${Math.round(number(plan.calories)).toLocaleString()} kcal</strong>
      </div>
      <p class="nutrition-plan-card-macros">${roundMacro(plan.protein_g)}g protein · ${roundMacro(plan.carbs_g)}g carbs · ${roundMacro(plan.fat_g)}g fat</p>
      ${components.length > 1 ? `<div class="nutrition-plan-components-preview">${preview}${components.length > 5 ? `<br>+ ${components.length - 5} more` : ""}</div>` : ""}
      <div class="nutrition-plan-card-actions">
        <button class="nutrition-plan-eat-all" type="button" data-plan-action="eat-all" data-plan-id="${escapeHtml(plan.id)}">Ate all</button>
        ${selectable ? `<button class="nutrition-plan-select-items" type="button" data-plan-action="select-items" data-plan-id="${escapeHtml(plan.id)}">Select items</button>` : `<span></span>`}
        <button class="nutrition-plan-discard" type="button" data-plan-action="discard" data-plan-id="${escapeHtml(plan.id)}">Discard</button>
      </div>
      ${selectable ? buildItemSelectorMarkup(plan, components) : ""}
    `;

    return card;
  }

  function buildItemSelectorMarkup(plan, components) {
    return `
      <div class="nutrition-plan-item-selector" data-selector-for="${escapeHtml(plan.id)}" hidden>
        <div class="nutrition-plan-check-list">
          ${components.map((item, index) => `
            <label class="nutrition-plan-check-row">
              <input type="checkbox" value="${index}" />
              <span>
                <strong>${escapeHtml(item.name)}</strong>
                <small>${escapeHtml(item.amount || "Planned portion")}</small>
              </span>
              <span>${Math.round(number(item.calories))} kcal</span>
            </label>
          `).join("")}
        </div>
        <div class="nutrition-plan-selection-actions">
          <button class="nutrition-plan-log-selected" type="button" data-plan-action="log-selected" data-plan-id="${escapeHtml(plan.id)}">Log selected</button>
          <button class="nutrition-plan-cancel-select" type="button" data-plan-action="cancel-select" data-plan-id="${escapeHtml(plan.id)}">Cancel</button>
        </div>
      </div>
    `;
  }

  function renderFavoriteShelf() {
    const container = els.favoriteShelf;
    if (!container) return;
    container.replaceChildren();

    if (!state.favoritesLoaded && state.mode !== "plan") {
      const lazy = document.createElement("div");
      lazy.className = "nutrition-plan-shelf-empty";
      lazy.textContent = "Favorites load when Meal Plan opens.";
      container.appendChild(lazy);
      return;
    }

    if (!state.favorites.length) {
      const empty = document.createElement("div");
      empty.className = "nutrition-plan-shelf-empty";
      empty.textContent = "No favorites yet. Tap the star on a recent meal to keep it here.";
      container.appendChild(empty);
      return;
    }

    state.favorites.forEach((meal) => {
      const card = document.createElement("article");
      card.className = "nutrition-quick-meal-card";
      card.dataset.mealId = clean(meal.id);
      const slot = fallbackSlotForMeal(meal);

      card.innerHTML = `
        <button class="nutrition-quick-meal-favorite is-favorite" type="button" data-plan-action="favorite" data-meal-id="${escapeHtml(meal.id)}" aria-label="Remove from favorites">★</button>
        <span class="nutrition-quick-meal-card__slot">${escapeHtml(slotLabel(slot))}</span>
        <h5>${escapeHtml(meal.name || "Meal")}</h5>
        <p class="nutrition-quick-meal-card__meta">${Math.round(number(meal.calories)).toLocaleString()} kcal · ${roundMacro(readMealMacro(meal, "protein"))}P · ${roundMacro(readMealMacro(meal, "carbs"))}C</p>
        <button class="nutrition-quick-meal-add" type="button" data-plan-action="quick-add" data-meal-id="${escapeHtml(meal.id)}">+ Add to ${escapeHtml(slotLabel(slot))}</button>
      `;

      container.appendChild(card);
    });
  }

  function getRecentPageMeals() {
    const recent = window.AriNutritionPage?.getState?.()?.recentMeals;
    return Array.isArray(recent) ? recent : [];
  }

  function recentContainer() {
    return document.getElementById("recentMealList") || document.getElementById("recentMealsList");
  }

  function recentSectionIsOpen() {
    const section = document.getElementById("recentMealsSection");
    return !section || section.open === true;
  }

  function decorateRecentMeals() {
    if (!recentSectionIsOpen()) return;

    const container = recentContainer();
    const recentMeals = getRecentPageMeals();
    if (!container || !recentMeals.length) return;

    const cards = Array.from(container.querySelectorAll(":scope > .nutrition-recent-meal, :scope > .nutrition-meal-card"));
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

      const isFavorite = meal.is_favorite === true || state.favorites.some((item) => String(item.id) === String(meal.id));
      const favorite = document.createElement("button");
      favorite.type = "button";
      favorite.className = `nutrition-recent-favorite-btn${isFavorite ? " is-favorite" : ""}`;
      favorite.textContent = isFavorite ? "★" : "☆";
      favorite.setAttribute("aria-label", isFavorite ? "Remove from Favorites" : "Add to Favorites");
      favorite.addEventListener("click", () => void toggleFavorite(meal));

      const slot = fallbackSlotForMeal(meal);
      const add = document.createElement("button");
      add.type = "button";
      add.className = "nutrition-recent-add-plan-btn";
      add.textContent = `+ Add to ${slotLabel(slot)}`;
      add.addEventListener("click", () => void addQuickMeal(meal, "recent"));

      actions.append(favorite, add);
    });
  }

  function scheduleRecentDecoration() {
    window.clearTimeout(state.recentDecorateTimer);
    state.recentDecorateTimer = window.setTimeout(decorateRecentMeals, 40);
  }

  function findPlan(id) {
    return state.plans.find((plan) => String(plan.id) === String(id)) || null;
  }

  function findQuickMeal(id) {
    return state.favorites.find((meal) => String(meal.id) === String(id)) ||
      getRecentPageMeals().find((meal) => String(meal.id) === String(id)) || null;
  }

  function handlePlanPaneClick(event) {
    const button = event.target.closest("[data-plan-action]");
    if (!button || state.busy) return;

    const action = button.dataset.planAction;
    const plan = button.dataset.planId ? findPlan(button.dataset.planId) : null;

    if (action === "select-items" && plan) {
      const selector = els.planList?.querySelector(`[data-selector-for="${CSS.escape(String(plan.id))}"]`);
      if (selector) selector.hidden = !selector.hidden;
      return;
    }

    if (action === "cancel-select" && plan) {
      const selector = els.planList?.querySelector(`[data-selector-for="${CSS.escape(String(plan.id))}"]`);
      if (selector) {
        selector.hidden = true;
        selector.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = false; });
      }
      return;
    }

    if (action === "eat-all" && plan) {
      void logWholePlan(plan);
      return;
    }

    if (action === "log-selected" && plan) {
      void logSelectedComponents(plan);
      return;
    }

    if (action === "discard" && plan) {
      handleDiscardPress(button, plan);
      return;
    }

    if (action === "quick-add") {
      const meal = findQuickMeal(button.dataset.mealId);
      if (meal) void addQuickMeal(meal, "favorites");
      return;
    }

    if (action === "favorite") {
      const meal = findQuickMeal(button.dataset.mealId);
      if (meal) void toggleFavorite(meal);
    }
  }

  function handleDiscardPress(button, plan) {
    if (button.dataset.confirmDiscard === "true") {
      delete button.dataset.confirmDiscard;
      void discardPlan(plan);
      return;
    }

    button.dataset.confirmDiscard = "true";
    const previous = button.textContent;
    button.textContent = "Tap again";
    window.clearTimeout(state.discardTimer);
    state.discardTimer = window.setTimeout(() => {
      if (button.isConnected) {
        delete button.dataset.confirmDiscard;
        button.textContent = previous;
      }
    }, 2200);
  }

  async function ensurePlansLoaded() {
    if (!state.plansLoaded) await loadPlans();
  }

  async function addQuickMeal(meal, shelf = "recent") {
    if (state.busy) return;
    await ensurePlansLoaded();

    const slot = fallbackSlotForMeal(meal);
    const existing = state.plans.some((plan) => normalizeSlot(plan.meal_slot) === slot);
    if (existing) {
      showToast(`${slotLabel(slot)} already has an active plan today.`);
      return;
    }

    const record = {
      plan_date: todayKey(),
      meal_slot: slot,
      name: clean(meal.name) || "Meal",
      calories: Math.max(0, Math.round(number(meal.calories))),
      protein_g: Math.max(0, roundMacro(readMealMacro(meal, "protein"))),
      carbs_g: Math.max(0, roundMacro(readMealMacro(meal, "carbs"))),
      fat_g: Math.max(0, roundMacro(readMealMacro(meal, "fat"))),
      serving_size: clean(meal.serving_size) || "Recent meal",
      multiplier: Math.max(.01, number(meal.multiplier, 1) || 1),
      source_type: shelf === "favorites" ? "saved_meal" : "recent",
      source_ref: clean(meal.id) || null,
      items: [],
      notes: shelf === "recent" ? "Added from Recent Meals" : "",
      status: "planned",
      position: 0,
      updated_at: new Date().toISOString()
    };

    state.busy = true;
    try {
      const saved = await insertPlanRecord(record);
      state.plans.push(saved);
      render();
      showToast(`${record.name} added to today's ${slotLabel(slot).toLowerCase()}.`);
      dispatchChanged(shelf === "recent" ? "recent_added" : "quick_added", saved);
    } catch (error) {
      console.error("[ARI Today Meal Plan] Add to plan failed:", error);
      showToast("That meal could not be added to Meal Plan.");
    } finally {
      state.busy = false;
    }
  }

  async function insertPlanRecord(record) {
    const user = await getUser();
    const client = window.calbuddySupabase;

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_plan_items")
        .insert({ user_id: user.id, ...record })
        .select("*")
        .single();

      if (!error && data) return { ...data, storage_source: "supabase" };
      console.warn("[ARI Today Meal Plan] Cloud plan save failed; using local fallback:", error?.message || "unknown error");
    }

    const saved = {
      id: localId("plan"),
      ...record,
      created_at: new Date().toISOString(),
      storage_source: "local"
    };
    const local = readLocalArray(PLAN_LOCAL_KEY);
    local.push(saved);
    writeLocalArray(PLAN_LOCAL_KEY, local);
    return saved;
  }

  async function updatePlan(plan, changes = {}) {
    const updatedAt = new Date().toISOString();

    if (plan.storage_source === "supabase" && window.calbuddySupabase) {
      let query = window.calbuddySupabase
        .from("nutrition_plan_items")
        .update({ ...changes, updated_at: updatedAt })
        .eq("id", plan.id);

      if (state.user?.id) query = query.eq("user_id", state.user.id);
      const { data, error } = await query.select("*").single();
      if (error) throw error;
      return { ...data, storage_source: "supabase" };
    }

    const local = readLocalArray(PLAN_LOCAL_KEY);
    const index = local.findIndex((item) => String(item.id) === String(plan.id));
    if (index >= 0) {
      local[index] = { ...local[index], ...changes, updated_at: updatedAt, storage_source: "local" };
      writeLocalArray(PLAN_LOCAL_KEY, local);
      return local[index];
    }

    return { ...plan, ...changes, updated_at: updatedAt };
  }

  async function discardPlan(plan) {
    state.busy = true;
    try {
      await updatePlan(plan, { status: "skipped" });
      state.plans = state.plans.filter((item) => String(item.id) !== String(plan.id));
      render();
      showToast(`${plan.name || "Meal plan"} discarded.`);
      dispatchChanged("discarded", plan);
    } catch (error) {
      console.error("[ARI Today Meal Plan] Discard failed:", error);
      showToast("That plan could not be discarded.");
    } finally {
      state.busy = false;
    }
  }

  async function saveConsumedMeal(plan, nutrition, name, servingSize) {
    const user = await getUser();
    const client = window.calbuddySupabase;
    const record = {
      name: clean(name) || clean(plan.name) || "Meal",
      calories: Math.max(0, Math.round(number(nutrition.calories))),
      category: slotLabel(plan.meal_slot),
      nutrition_date: todayKey(),
      protein_g: Math.max(0, roundMacro(nutrition.protein_g)),
      carbs_g: Math.max(0, roundMacro(nutrition.carbs_g)),
      fat_g: Math.max(0, roundMacro(nutrition.fat_g)),
      serving_size: clean(servingSize) || clean(plan.serving_size) || "Meal plan",
      multiplier: 1,
      is_favorite: false,
      created_at: new Date().toISOString()
    };

    if (user?.id && client) {
      const { data, error } = await client
        .from("meals")
        .insert({ user_id: user.id, ...record })
        .select("*")
        .single();

      if (!error && data) return { ...data, source: "supabase" };
      console.warn("[ARI Today Meal Plan] Cloud meal log failed; using local fallback:", error?.message || "unknown error");
    }

    const saved = { id: localId("meal"), ...record, source: "local" };
    const local = readLocalArray(LOCAL_MEALS_KEY);
    local.push(saved);
    writeLocalArray(LOCAL_MEALS_KEY, local);
    return saved;
  }

  async function logWholePlan(plan) {
    state.busy = true;
    try {
      const meal = await saveConsumedMeal(
        plan,
        {
          calories: plan.calories,
          protein_g: plan.protein_g,
          carbs_g: plan.carbs_g,
          fat_g: plan.fat_g
        },
        plan.name,
        plan.serving_size
      );

      await updatePlan(plan, {
        status: "eaten",
        consumed_meal_id: String(meal.id || "")
      });

      state.plans = state.plans.filter((item) => String(item.id) !== String(plan.id));
      render();
      await refreshNutritionTotals();
      showToast(`${plan.name || "Meal"} logged as eaten.`);
      dispatchChanged("eaten", plan);
    } catch (error) {
      console.error("[ARI Today Meal Plan] Log all failed:", error);
      showToast("That meal could not be logged.");
    } finally {
      state.busy = false;
    }
  }

  async function logSelectedComponents(plan) {
    const card = els.planList?.querySelector(`[data-plan-id="${CSS.escape(String(plan.id))}"]`);
    const selector = card?.querySelector(`[data-selector-for="${CSS.escape(String(plan.id))}"]`);
    if (!selector) return;

    const components = normalizeComponents(plan.items, plan);
    const selectedIndexes = Array.from(selector.querySelectorAll('input[type="checkbox"]:checked'))
      .map((input) => Number(input.value))
      .filter((index) => Number.isInteger(index) && components[index]);

    if (!selectedIndexes.length) {
      showToast("Select at least one item first.");
      return;
    }

    const selectedSet = new Set(selectedIndexes);
    const selected = components.filter((_, index) => selectedSet.has(index));
    const remaining = components.filter((_, index) => !selectedSet.has(index));
    const consumed = sumComponents(selected);
    const selectedNames = selected.map((item) => item.name).filter(Boolean);

    state.busy = true;
    try {
      const meal = await saveConsumedMeal(
        plan,
        consumed,
        selectedNames.length <= 3 ? selectedNames.join(" + ") : `${plan.name || "Meal"} · selected items`,
        "Selected from today's meal plan"
      );

      if (!remaining.length) {
        await updatePlan(plan, {
          status: "eaten",
          consumed_meal_id: String(meal.id || "")
        });
        state.plans = state.plans.filter((item) => String(item.id) !== String(plan.id));
      } else {
        const remainder = sumComponents(remaining);
        const names = remaining.map((item) => clean(item.name)).filter(Boolean);
        const updated = await updatePlan(plan, {
          name: names.length <= 3 ? names.join(" + ") : `${slotLabel(plan.meal_slot)} remaining items`,
          items: remaining,
          calories: Math.round(remainder.calories),
          protein_g: roundMacro(remainder.protein_g),
          carbs_g: roundMacro(remainder.carbs_g),
          fat_g: roundMacro(remainder.fat_g),
          serving_size: "Remaining planned items",
          notes: clean(plan.notes)
            ? `${clean(plan.notes)} | Partially eaten`
            : "Partially eaten"
        });
        const index = state.plans.findIndex((item) => String(item.id) === String(plan.id));
        if (index >= 0) state.plans[index] = updated;
      }

      render();
      await refreshNutritionTotals();
      showToast(`${selectedNames.join(", ")} logged.`);
      dispatchChanged("partially_eaten", plan);
    } catch (error) {
      console.error("[ARI Today Meal Plan] Selected-item log failed:", error);
      showToast("Those items could not be logged.");
    } finally {
      state.busy = false;
    }
  }

  async function toggleFavorite(meal) {
    if (state.busy || !meal) return;

    const next = !(meal.is_favorite === true || state.favorites.some((item) => String(item.id) === String(meal.id)));
    state.busy = true;

    try {
      const cloudMeal = meal.storage_source === "supabase" || meal.source === "supabase";
      if (cloudMeal && window.calbuddySupabase) {
        let query = window.calbuddySupabase
          .from("meals")
          .update({ is_favorite: next })
          .eq("id", meal.id);
        if (state.user?.id) query = query.eq("user_id", state.user.id);
        const { error } = await query;
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
      if (next) {
        state.favorites = dedupeMeals([{ ...meal, is_favorite: true }, ...state.favorites]);
        showToast(`${meal.name || "Meal"} added to Favorites.`);
      } else {
        state.favorites = state.favorites.filter((item) => String(item.id) !== String(meal.id));
        showToast(`${meal.name || "Meal"} removed from Favorites.`);
      }

      state.favoritesLoaded = true;
      renderFavoriteShelf();
      scheduleRecentDecoration();
    } catch (error) {
      console.error("[ARI Today Meal Plan] Favorite update failed:", error);
      showToast("Favorite could not be updated.");
    } finally {
      state.busy = false;
    }
  }

  async function refreshNutritionTotals() {
    try {
      if (typeof window.AriNutritionPage?.refresh === "function") {
        await window.AriNutritionPage.refresh();
      } else if (typeof window.refreshNutritionPage === "function") {
        await window.refreshNutritionPage();
      }
    } catch (error) {
      console.warn("[ARI Today Meal Plan] Nutrition refresh failed:", error?.message || error);
    }

    window.dispatchEvent(new CustomEvent("ari:mealLogged", {
      detail: { source: "today_meal_plan" }
    }));
  }

  function showToast(message) {
    document.getElementById("nutritionPlanToast")?.remove();
    const toast = document.createElement("div");
    toast.id = "nutritionPlanToast";
    toast.className = "nutrition-plan-toast";
    toast.setAttribute("role", "status");
    toast.textContent = clean(message);
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2300);
  }

  function dispatchChanged(action, payload) {
    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", {
      detail: {
        action,
        payload,
        date: todayKey(),
        source: "today_meal_plan_ui",
        version: VERSION
      }
    }));
  }

  function getAriContext() {
    const plannedCalories = state.plans.reduce((sum, plan) => sum + Math.max(0, number(plan.calories)), 0);
    const goal = dailyGoal();
    const consumed = consumedToday();
    return {
      date: todayKey(),
      calorieGoal: goal,
      consumedCalories: consumed,
      plannedCalories,
      remainingCalories: goal ? Math.max(0, goal - consumed - plannedCalories) : null,
      plannedMeals: state.plans.map((plan) => ({
        id: plan.id,
        slot: normalizeSlot(plan.meal_slot),
        name: plan.name,
        calories: number(plan.calories),
        protein_g: number(plan.protein_g),
        carbs_g: number(plan.carbs_g),
        fat_g: number(plan.fat_g)
      }))
    };
  }

  function findPlannedSlot(date, slot) {
    if (clean(date) !== todayKey()) return [];
    const normalized = normalizeSlot(slot);
    return state.plans.filter((plan) => normalizeSlot(plan.meal_slot) === normalized);
  }

  async function refresh(options = {}) {
    const includeFavorites = options.includeFavorites === true || state.mode === "plan";
    const jobs = [loadPlans()];
    if (includeFavorites) jobs.push(loadFavorites());
    await Promise.all(jobs);
    render();
    return getState();
  }

  function getState() {
    return {
      version: VERSION,
      mode: state.mode,
      date: todayKey(),
      plans: state.plans.map((plan) => ({ ...plan })),
      favorites: state.favorites.map((meal) => ({ ...meal }))
    };
  }

  function installPublicApi() {
    window.AriNutritionMealPlanner = Object.freeze({
      version: VERSION,
      setMode,
      refresh,
      getState,
      getAriContext,
      findPlannedSlot,
      decorateRecentMeals,
      updateRemainingCalories
    });
  }

  function bindRecentHistoryActions() {
    const section = document.getElementById("recentMealsSection");
    section?.addEventListener("toggle", () => {
      if (section.open) scheduleRecentDecoration();
    });

    window.addEventListener("calbuddy:mealsChanged", scheduleRecentDecoration);
    window.addEventListener("ari:mealLogged", scheduleRecentDecoration);
    window.addEventListener("ari:meal-ledger-synced", () => {
      updateRemainingCalories();
      scheduleRecentDecoration();
    });

    window.addEventListener("storage", (event) => {
      if ([DAILY_GOAL_KEY, CONSUMED_KEY, CONSUMED_DATE_KEY].includes(event.key)) {
        updateRemainingCalories();
      }
    });
  }

  function bindExternalEvents() {
    let refreshingFromEvent = false;

    window.addEventListener("ari:nutritionMealPlanChanged", async (event) => {
      if (event?.detail?.source === "today_meal_plan_ui") return;
      if (refreshingFromEvent) return;
      refreshingFromEvent = true;
      try {
        await refresh({ includeFavorites: state.mode === "plan" });
      } finally {
        refreshingFromEvent = false;
      }
    });

    window.addEventListener("focus", () => {
      if (state.mode === "plan") void refresh({ includeFavorites: true });
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && state.mode === "plan") {
        void refresh({ includeFavorites: true });
      }
    });
  }

  async function boot() {
    cacheElements();
    if (!els.section || !els.header || !els.form) return;

    injectCss();
    buildTabs();
    buildPlanPane();
    installPublicApi();
    bindExternalEvents();
    bindRecentHistoryActions();

    // Only the small plan query runs at startup. Favorite meals stay lazy until
    // Meal Plan is actually opened; Recent Meals are reused from Nutrition.
    await loadPlans();
    render();
    await setMode("log");

    console.info(`[ARI Today Meal Plan] Ready. Version ${VERSION}.`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
