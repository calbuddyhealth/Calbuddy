// =====================================================
// ARI XP
// File: js/nutrition-meal-planner.js
// Version: 1.0.1
// Purpose:
//   Weekly meal planning layer that reuses the existing Nutrition
//   meal builder instead of creating a second logging form.
// =====================================================

(() => {
  "use strict";

  const VERSION = "1.0.1";
  const PLAN_LOCAL_KEY = "ariNutritionMealPlanV1";
  const RECIPE_LOCAL_KEY = "ariNutritionRecipesV1";
  const TEMPLATE_LOCAL_KEY = "ariNutritionPlanTemplatesV1";
  const DAILY_GOAL_KEY = "calbuddyDailyCalorieGoal";
  const DAILY_TARGETS_KEY = "calbuddyDailyNutritionTargets";
  const CONSUMED_KEY = "calbuddyCaloriesConsumed";
  const CONSUMED_DATE_KEY = "calbuddyCaloriesConsumedDate";

  const SLOT_ORDER = ["breakfast", "lunch", "dinner", "snack"];
  const SLOT_LABELS = Object.freeze({
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack"
  });
  const SLOT_TIMES = Object.freeze({
    breakfast: "08:00",
    lunch: "12:30",
    dinner: "18:30",
    snack: "15:30"
  });

  const state = {
    mode: "log",
    user: null,
    selectedDate: formatDateKey(new Date()),
    weekStart: getSundayStartKey(new Date()),
    items: [],
    recipes: [],
    templates: [],
    planDraft: null,
    sheetSlot: null,
    sheetMode: "choices",
    loaded: false,
    saving: false
  };

  const els = {};

  function clean(value = "") {
    return String(value ?? "").trim();
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function roundMacro(value) {
    return Math.round(number(value) * 10) / 10;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function parseDateKey(value) {
    const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (
      date.getFullYear() !== Number(match[1]) ||
      date.getMonth() !== Number(match[2]) - 1 ||
      date.getDate() !== Number(match[3])
    ) return null;
    return date;
  }

  function addDays(dateValue, days) {
    const date = dateValue instanceof Date ? new Date(dateValue) : parseDateKey(dateValue);
    if (!date) return null;
    date.setDate(date.getDate() + Number(days || 0));
    return date;
  }

  function getSundayStartKey(value) {
    const date = value instanceof Date ? new Date(value) : parseDateKey(value);
    if (!date) return formatDateKey(new Date());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - date.getDay());
    return formatDateKey(date);
  }

  function weekEndKey() {
    return formatDateKey(addDays(state.weekStart, 6));
  }

  function dateLabel(value, options = {}) {
    const date = parseDateKey(value);
    if (!date) return value;
    return new Intl.DateTimeFormat(undefined, {
      weekday: options.weekday === false ? undefined : "long",
      month: "short",
      day: "numeric"
    }).format(date);
  }

  function weekLabel() {
    const start = parseDateKey(state.weekStart);
    const end = addDays(start, 6);
    if (!start || !end) return "This week";
    const startText = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(start);
    const endText = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(end);
    return `${startText} – ${endText}`;
  }

  function slotLabel(slot) {
    return SLOT_LABELS[clean(slot).toLowerCase()] || "Meal";
  }

  function localStorageArray(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeLocalStorageArray(key, values) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(values) ? values : []));
  }

  function makeLocalId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
      console.warn("[ARI Meal Planner] User lookup failed:", error?.message || error);
    }

    return state.user;
  }

  function injectStylesheet() {
    if (document.getElementById("ariNutritionMealPlannerCss")) return;
    const link = document.createElement("link");
    link.id = "ariNutritionMealPlannerCss";
    link.rel = "stylesheet";
    link.href = "assets/css/nutrition-meal-planner.css?v=1.0.1";
    document.head.appendChild(link);
  }

  function injectActionRuntime() {
    if (document.getElementById("ariNutritionMealPlanActionScript")) return;
    const script = document.createElement("script");
    script.id = "ariNutritionMealPlanActionScript";
    script.src = "ari/actions/ari-meal-plan-action.js?v=1.0.0";
    script.async = false;
    document.head.appendChild(script);
  }

  function cacheElements() {
    els.section = document.getElementById("manualEntrySection");
    els.header = els.section?.querySelector(".ari-manual-header") || null;
    els.title = els.section?.querySelector(".ari-manual-title-group h2") || null;
    els.eyebrow = els.section?.querySelector(".ari-manual-eyebrow") || null;
    els.form = els.section?.querySelector(".ari-form") || null;
    els.status = document.getElementById("manualFoodSystemStatus");
    els.saveButton = document.getElementById("saveMealBtn");
    els.saveLabel = document.getElementById("saveMealLabel");
    els.saveIcon = document.getElementById("saveMealIcon");
    els.askAriSection = document.getElementById("askAriSection");
    els.ariInput = document.getElementById("ariInput");
  }

  function buildModeSwitch() {
    if (!els.header || document.getElementById("nutritionMealPlanModeToggle")) return;

    const wrap = document.createElement("div");
    wrap.className = "nutrition-mode-switch";

    const toggle = document.createElement("button");
    toggle.id = "nutritionMealPlanModeToggle";
    toggle.type = "button";
    toggle.setAttribute("aria-selected", "false");
    toggle.textContent = "Meal Plan";
    toggle.addEventListener("click", () => {
      if (state.mode === "log" && state.planDraft) {
        cancelPlanDraft();
        return;
      }
      if (state.mode === "log") setMode("plan");
      else setMode("log");
    });

    wrap.appendChild(toggle);
    els.header.insertBefore(wrap, els.status || null);
    els.modeToggle = toggle;
  }

  function buildPlannerWorkspace() {
    if (!els.section || document.getElementById("nutritionMealPlanWorkspace")) return;

    const workspace = document.createElement("div");
    workspace.id = "nutritionMealPlanWorkspace";
    workspace.className = "nutrition-plan-workspace";
    workspace.hidden = true;
    workspace.innerHTML = `
      <div class="nutrition-plan-toolbar">
        <button class="nutrition-plan-week-nav" id="nutritionPlanPrevWeek" type="button" aria-label="Previous week">‹</button>
        <div class="nutrition-plan-week-copy">
          <span>Weekly Meal Plan</span>
          <strong id="nutritionPlanWeekLabel">This week</strong>
        </div>
        <button class="nutrition-plan-week-nav" id="nutritionPlanNextWeek" type="button" aria-label="Next week">›</button>
      </div>

      <div class="nutrition-plan-utilities">
        <button id="nutritionMyRecipesButton" type="button">My Recipes</button>
        <button id="nutritionSaveWeekButton" type="button">Save Week</button>
        <button id="nutritionSavedPlansButton" type="button">Saved Plans</button>
      </div>

      <div id="nutritionPlanWeekStrip" class="nutrition-plan-week-strip" aria-label="Meal plan week"></div>

      <div class="nutrition-plan-selected-heading">
        <div>
          <p>Selected Day</p>
          <h3 id="nutritionPlanSelectedDate">Today</h3>
        </div>
        <button id="nutritionPlanTodayButton" type="button">Today</button>
      </div>

      <div id="nutritionPlanSlots" class="nutrition-plan-slots"></div>

      <section class="nutrition-plan-summary" aria-label="Planned nutrition summary">
        <div class="nutrition-plan-summary__top">
          <span>DAY PLAN</span>
          <strong id="nutritionPlanBudgetText">0 kcal planned</strong>
        </div>
        <div class="nutrition-plan-budget-track" aria-hidden="true">
          <div id="nutritionPlanBudgetFill" class="nutrition-plan-budget-fill"></div>
        </div>
        <div class="nutrition-plan-summary__macros">
          <div><span>Protein</span><strong id="nutritionPlanProtein">0g</strong></div>
          <div><span>Carbs</span><strong id="nutritionPlanCarbs">0g</strong></div>
          <div><span>Fat</span><strong id="nutritionPlanFat">0g</strong></div>
        </div>
      </section>
    `;

    els.section.appendChild(workspace);
    els.workspace = workspace;
    els.weekLabel = workspace.querySelector("#nutritionPlanWeekLabel");
    els.weekStrip = workspace.querySelector("#nutritionPlanWeekStrip");
    els.selectedDateLabel = workspace.querySelector("#nutritionPlanSelectedDate");
    els.slots = workspace.querySelector("#nutritionPlanSlots");
    els.budgetText = workspace.querySelector("#nutritionPlanBudgetText");
    els.budgetFill = workspace.querySelector("#nutritionPlanBudgetFill");
    els.protein = workspace.querySelector("#nutritionPlanProtein");
    els.carbs = workspace.querySelector("#nutritionPlanCarbs");
    els.fat = workspace.querySelector("#nutritionPlanFat");

    workspace.querySelector("#nutritionPlanPrevWeek")?.addEventListener("click", () => moveWeek(-7));
    workspace.querySelector("#nutritionPlanNextWeek")?.addEventListener("click", () => moveWeek(7));
    workspace.querySelector("#nutritionPlanTodayButton")?.addEventListener("click", selectToday);
    workspace.querySelector("#nutritionMyRecipesButton")?.addEventListener("click", () => openRecipeLibrary(null));
    workspace.querySelector("#nutritionSaveWeekButton")?.addEventListener("click", saveCurrentWeekTemplate);
    workspace.querySelector("#nutritionSavedPlansButton")?.addEventListener("click", openSavedPlans);

    els.weekStrip?.addEventListener("click", handleWeekDayClick);
    els.slots?.addEventListener("click", handlePlannerClick);
  }

  function buildSheet() {
    if (document.getElementById("nutritionPlanSheet")) return;

    const sheet = document.createElement("section");
    sheet.id = "nutritionPlanSheet";
    sheet.className = "nutrition-plan-sheet";
    sheet.hidden = true;
    sheet.setAttribute("aria-label", "Add to meal plan");
    sheet.innerHTML = `
      <div class="nutrition-plan-sheet__surface" role="dialog" aria-modal="true" aria-labelledby="nutritionPlanSheetTitle">
        <header class="nutrition-plan-sheet__header">
          <div>
            <p id="nutritionPlanSheetEyebrow">Meal Plan</p>
            <h3 id="nutritionPlanSheetTitle">Add a meal</h3>
          </div>
          <button id="nutritionPlanSheetClose" class="nutrition-plan-sheet__close" type="button" aria-label="Close">×</button>
        </header>
        <div id="nutritionPlanSheetBody" class="nutrition-plan-sheet__body"></div>
      </div>
    `;

    document.body.appendChild(sheet);
    els.sheet = sheet;
    els.sheetTitle = sheet.querySelector("#nutritionPlanSheetTitle");
    els.sheetEyebrow = sheet.querySelector("#nutritionPlanSheetEyebrow");
    els.sheetBody = sheet.querySelector("#nutritionPlanSheetBody");

    sheet.querySelector("#nutritionPlanSheetClose")?.addEventListener("click", closeSheet);
    sheet.addEventListener("click", (event) => {
      if (event.target === sheet) closeSheet();
    });
  }

  function bindSaveInterceptor() {
    if (!els.saveButton || els.saveButton.dataset.mealPlanInterceptor === "true") return;
    els.saveButton.dataset.mealPlanInterceptor = "true";
    els.saveButton.addEventListener("click", async (event) => {
      if (!state.planDraft) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      await saveSharedBuilderToPlan();
    }, true);
  }

  function resetSharedBuilder() {
    try {
      window.AriNutritionPage?.clearSelectedFood?.({ keepName: false, focusName: false });
    } catch {}

    ["mealName", "mealCalories", "mealProtein", "mealCarbs", "mealFat"].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = "";
    });
  }

  function cancelPlanDraft() {
    if (!state.planDraft) {
      setMode("plan", { force: true });
      return;
    }

    state.planDraft = null;
    resetSharedBuilder();
    setMode("plan", { force: true });
  }

  function setMode(mode, options = {}) {
    const next = mode === "plan" ? "plan" : "log";

    if (next === "plan") {
      const editing = window.AriNutritionPage?.getState?.()?.editingMeal;
      if (editing && options.force !== true) {
        window.alert("Finish or save the meal you are editing before opening Meal Plan.");
        return;
      }
    }

    state.mode = next;
    const isPlan = next === "plan";

    els.section?.classList.toggle("is-meal-plan-mode", isPlan);
    if (els.form) els.form.hidden = isPlan;
    if (els.workspace) els.workspace.hidden = !isPlan;

    if (els.title) els.title.textContent = isPlan ? "Meal Plan" : (state.planDraft ? `Add to ${slotLabel(state.planDraft.slot)}` : "Log a meal");
    if (els.eyebrow) {
      els.eyebrow.textContent = isPlan
        ? "Plan the week. Log it only when you eat it."
        : state.planDraft
          ? `${dateLabel(state.planDraft.date)} · ${slotLabel(state.planDraft.slot)}`
          : "Find a food or add your own";
    }

    if (els.modeToggle) {
      els.modeToggle.textContent = isPlan
        ? "Log Meal"
        : state.planDraft
          ? "Back to Plan"
          : "Meal Plan";
      els.modeToggle.setAttribute("aria-selected", String(isPlan));
    }

    if (isPlan) {
      renderAll();
    } else {
      syncSharedBuilderMode();
    }
  }

  function syncSharedBuilderMode() {
    if (!state.planDraft) {
      if (els.saveLabel) els.saveLabel.textContent = "Save Meal";
      if (els.saveIcon) els.saveIcon.textContent = "+";
      return;
    }

    if (els.saveLabel) els.saveLabel.textContent = `Add to ${slotLabel(state.planDraft.slot)} Plan`;
    if (els.saveIcon) els.saveIcon.textContent = "+";

    const mealType = document.getElementById("mealType");
    const mealDate = document.getElementById("mealDate");
    const mealTime = document.getElementById("mealTime");

    if (mealType) mealType.value = slotLabel(state.planDraft.slot);
    if (mealDate) mealDate.value = state.planDraft.date;
    if (mealTime) mealTime.value = SLOT_TIMES[state.planDraft.slot] || "12:00";
  }

  async function loadAll() {
    await getUser();
    await Promise.all([loadWeekItems(), loadRecipes(), loadTemplates()]);
    state.loaded = true;
    renderAll();
  }

  async function loadWeekItems() {
    const user = await getUser();
    const client = window.calbuddySupabase;

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_plan_items")
        .select("*")
        .eq("user_id", user.id)
        .gte("plan_date", state.weekStart)
        .lte("plan_date", weekEndKey())
        .order("plan_date", { ascending: true })
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error) {
        state.items = (data || []).map((item) => ({ ...item, storage_source: "supabase" }));
        return state.items;
      }

      console.warn("[ARI Meal Planner] Cloud plan load failed:", error.message);
    }

    state.items = localStorageArray(PLAN_LOCAL_KEY)
      .filter((item) => item.plan_date >= state.weekStart && item.plan_date <= weekEndKey())
      .map((item) => ({ ...item, storage_source: "local" }));

    return state.items;
  }

  async function loadRecipes() {
    const user = await getUser();
    const client = window.calbuddySupabase;

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!error) {
        state.recipes = (data || []).map((item) => ({ ...item, storage_source: "supabase" }));
        return state.recipes;
      }

      console.warn("[ARI Meal Planner] Recipe load failed:", error.message);
    }

    state.recipes = localStorageArray(RECIPE_LOCAL_KEY).map((item) => ({ ...item, storage_source: "local" }));
    return state.recipes;
  }

  async function loadTemplates() {
    const user = await getUser();
    const client = window.calbuddySupabase;

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_plan_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!error) {
        state.templates = (data || []).map((item) => ({ ...item, storage_source: "supabase" }));
        return state.templates;
      }

      console.warn("[ARI Meal Planner] Template load failed:", error.message);
    }

    state.templates = localStorageArray(TEMPLATE_LOCAL_KEY).map((item) => ({ ...item, storage_source: "local" }));
    return state.templates;
  }

  function renderAll() {
    if (!els.workspace) return;
    renderWeekStrip();
    renderSelectedDay();
    renderSummary();
  }

  function renderWeekStrip() {
    if (!els.weekStrip) return;
    els.weekStrip.replaceChildren();
    if (els.weekLabel) els.weekLabel.textContent = weekLabel();

    const todayKey = formatDateKey(new Date());

    for (let index = 0; index < 7; index += 1) {
      const date = addDays(state.weekStart, index);
      const key = formatDateKey(date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nutrition-plan-day";
      button.dataset.date = key;
      if (key === state.selectedDate) button.classList.add("is-selected");
      if (key === todayKey) button.classList.add("is-today");
      if (state.items.some((item) => item.plan_date === key && item.status !== "skipped")) button.classList.add("has-plan");

      button.innerHTML = `
        <span>${new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date).slice(0, 3).toUpperCase()}</span>
        <strong>${date.getDate()}</strong>
        <i aria-hidden="true"></i>
      `;
      button.setAttribute("aria-label", dateLabel(key));
      els.weekStrip.appendChild(button);
    }
  }

  function renderSelectedDay() {
    if (!els.slots) return;
    if (els.selectedDateLabel) els.selectedDateLabel.textContent = dateLabel(state.selectedDate);
    els.slots.replaceChildren();

    SLOT_ORDER.forEach((slot) => {
      const slotItems = state.items
        .filter((item) => item.plan_date === state.selectedDate && item.meal_slot === slot && item.status !== "skipped")
        .sort((a, b) => number(a.position) - number(b.position));

      const calories = slotItems.reduce((sum, item) => sum + number(item.calories), 0);
      const card = document.createElement("article");
      card.className = "nutrition-plan-slot";
      card.dataset.slot = slot;

      const itemMarkup = slotItems.length
        ? slotItems.map((item) => renderPlanItemMarkup(item)).join("")
        : `<div class="nutrition-plan-sheet-empty">Nothing planned yet.</div>`;

      card.innerHTML = `
        <header class="nutrition-plan-slot__header">
          <h4>${slotLabel(slot)}</h4>
          <span>${slotItems.length ? `${Math.round(calories)} kcal` : "Open"}</span>
        </header>
        <div class="nutrition-plan-slot__items">${itemMarkup}</div>
        <button class="nutrition-plan-add" type="button" data-plan-action="add" data-slot="${slot}">+ Add ${slotLabel(slot)}</button>
      `;

      els.slots.appendChild(card);
    });
  }

  function renderPlanItemMarkup(item) {
    const eaten = item.status === "eaten";
    const safeName = escapeHtml(item.name || "Planned meal");
    const macros = `${roundMacro(item.protein_g)}g protein · ${roundMacro(item.carbs_g)}g carbs · ${roundMacro(item.fat_g)}g fat`;

    return `
      <article class="nutrition-plan-item ${eaten ? "is-eaten" : ""}" data-plan-item-id="${escapeHtml(item.id || "")}">
        <div class="nutrition-plan-item__top">
          <h5>${safeName}</h5>
          <span class="nutrition-plan-item__kcal">${Math.round(number(item.calories))} kcal</span>
        </div>
        <p class="nutrition-plan-item__macros">${macros}</p>
        <div class="nutrition-plan-item__status">
          ${eaten
            ? `<span class="nutrition-plan-eaten-label">✓ EATEN</span>`
            : `<button type="button" data-plan-action="eat" data-item-id="${escapeHtml(item.id || "")}">Log as eaten</button>`}
          <button type="button" data-plan-action="delete" data-item-id="${escapeHtml(item.id || "")}">Delete</button>
        </div>
      </article>
    `;
  }

  function selectedDayItems() {
    return state.items.filter((item) => item.plan_date === state.selectedDate && item.status !== "skipped");
  }

  function dailyGoal() {
    const value = number(localStorage.getItem(DAILY_GOAL_KEY), 0);
    return value > 0 ? Math.round(value) : 0;
  }

  function consumedCaloriesForDate(dateKey) {
    const consumedDate = clean(localStorage.getItem(CONSUMED_DATE_KEY));
    if (consumedDate !== dateKey) return 0;
    return Math.max(0, number(localStorage.getItem(CONSUMED_KEY), 0));
  }

  function renderSummary() {
    const items = selectedDayItems();
    const totals = items.reduce((sum, item) => {
      sum.calories += number(item.calories);
      sum.protein += number(item.protein_g);
      sum.carbs += number(item.carbs_g);
      sum.fat += number(item.fat_g);
      return sum;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const goal = dailyGoal();
    if (els.budgetText) {
      els.budgetText.textContent = goal
        ? `${Math.round(totals.calories).toLocaleString()} / ${goal.toLocaleString()} kcal planned`
        : `${Math.round(totals.calories).toLocaleString()} kcal planned`;
    }

    if (els.budgetFill) {
      const percent = goal ? Math.min(100, Math.max(0, (totals.calories / goal) * 100)) : 0;
      els.budgetFill.style.width = `${percent}%`;
    }

    if (els.protein) els.protein.textContent = `${roundMacro(totals.protein)}g`;
    if (els.carbs) els.carbs.textContent = `${roundMacro(totals.carbs)}g`;
    if (els.fat) els.fat.textContent = `${roundMacro(totals.fat)}g`;
  }

  function handleWeekDayClick(event) {
    const button = event.target.closest("[data-date]");
    if (!button?.dataset.date) return;
    state.selectedDate = button.dataset.date;
    renderAll();
  }

  function handlePlannerClick(event) {
    const action = event.target.closest("[data-plan-action]");
    if (!action) return;

    const type = action.dataset.planAction;
    if (type === "add") {
      openAddSheet(action.dataset.slot);
      return;
    }

    const item = state.items.find((entry) => String(entry.id) === String(action.dataset.itemId));
    if (!item) return;

    if (type === "eat") void confirmLogAsEaten(item);
    if (type === "delete") void deletePlanItem(item);
  }

  async function moveWeek(days) {
    const next = addDays(state.weekStart, days);
    state.weekStart = formatDateKey(next);
    state.selectedDate = state.weekStart;
    await loadWeekItems();
    renderAll();
  }

  async function selectToday() {
    const today = formatDateKey(new Date());
    state.selectedDate = today;
    state.weekStart = getSundayStartKey(today);
    await loadWeekItems();
    renderAll();
  }

  function openSheet(title, eyebrow = "Meal Plan") {
    if (!els.sheet) return;
    if (els.sheetTitle) els.sheetTitle.textContent = title;
    if (els.sheetEyebrow) els.sheetEyebrow.textContent = eyebrow;
    els.sheet.hidden = false;
    document.body.classList.add("nutrition-plan-sheet-open");
  }

  function closeSheet() {
    if (els.sheet) els.sheet.hidden = true;
    document.body.classList.remove("nutrition-plan-sheet-open");
    state.sheetMode = "choices";
  }

  function openAddSheet(slot) {
    state.sheetSlot = SLOT_ORDER.includes(slot) ? slot : "lunch";
    state.sheetMode = "choices";
    openSheet(`Add ${slotLabel(state.sheetSlot)}`, dateLabel(state.selectedDate));
    renderAddChoices();
  }

  function renderAddChoices() {
    if (!els.sheetBody) return;
    els.sheetBody.innerHTML = `
      <div class="nutrition-plan-choice-grid">
        <button class="nutrition-plan-choice is-ari" type="button" data-choice="ari">
          <strong>Ask Ari</strong>
          <span>Create something that fits this day.</span>
        </button>
        <button class="nutrition-plan-choice" type="button" data-choice="recent">
          <strong>Recent Meals</strong>
          <span>Reuse something you already ate.</span>
        </button>
        <button class="nutrition-plan-choice" type="button" data-choice="recipes">
          <strong>My Recipes</strong>
          <span>Schedule a saved recipe.</span>
        </button>
        <button class="nutrition-plan-choice" type="button" data-choice="search">
          <strong>Search Food</strong>
          <span>Use the same ARI meal builder.</span>
        </button>
      </div>
    `;

    els.sheetBody.querySelectorAll("[data-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const choice = button.dataset.choice;
        if (choice === "ari") askAriForSlot();
        if (choice === "recent") renderRecentMealChoices();
        if (choice === "recipes") openRecipeLibrary(state.sheetSlot, true);
        if (choice === "search") beginPlanBuilder(state.selectedDate, state.sheetSlot);
      });
    });
  }

  function renderSheetBack(label = "Back") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nutrition-plan-sheet-back";
    button.textContent = `‹ ${label}`;
    button.addEventListener("click", renderAddChoices);
    return button;
  }

  function renderRecentMealChoices() {
    if (!els.sheetBody) return;
    const recent = window.AriNutritionPage?.getState?.()?.recentMeals || [];
    els.sheetBody.replaceChildren();
    els.sheetBody.appendChild(renderSheetBack());

    const list = document.createElement("div");
    list.className = "nutrition-plan-sheet-list";

    if (!recent.length) {
      list.innerHTML = `<div class="nutrition-plan-sheet-empty">No recent meals yet. Search for a food or ask Ari instead.</div>`;
    } else {
      recent.slice(0, 12).forEach((meal) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nutrition-plan-sheet-item";
        button.innerHTML = `
          <span>
            <strong>${escapeHtml(meal.name || "Meal")}</strong>
            <small>${escapeHtml(meal.category || "Meal")} · ${roundMacro(readMealMacro(meal, "protein"))}P · ${roundMacro(readMealMacro(meal, "carbs"))}C · ${roundMacro(readMealMacro(meal, "fat"))}F</small>
          </span>
          <strong>${Math.round(number(meal.calories))} kcal</strong>
        `;
        button.addEventListener("click", async () => {
          await addPlanItem({
            plan_date: state.selectedDate,
            meal_slot: state.sheetSlot,
            name: meal.name || "Meal",
            calories: number(meal.calories),
            protein_g: readMealMacro(meal, "protein"),
            carbs_g: readMealMacro(meal, "carbs"),
            fat_g: readMealMacro(meal, "fat"),
            serving_size: meal.serving_size || "Recent meal",
            multiplier: number(meal.multiplier, 1) || 1,
            source_type: "recent",
            source_ref: clean(meal.id)
          });
          closeSheet();
        });
        list.appendChild(button);
      });
    }

    els.sheetBody.appendChild(list);
  }

  function readMealMacro(meal, macro) {
    const keys = macro === "protein"
      ? ["protein_g", "protein"]
      : macro === "carbs"
        ? ["carbs_g", "carbs", "carbohydrates_g", "carbohydrates"]
        : ["fat_g", "fat"];
    for (const key of keys) {
      if (meal?.[key] !== undefined && meal?.[key] !== null) return number(meal[key]);
    }
    return 0;
  }

  function askAriForSlot() {
    const slot = state.sheetSlot || "lunch";
    const date = state.selectedDate;

    closeSheet();
    setMode("log");

    if (els.ariInput) {
      els.ariInput.value = `Make me a meal plan for ${slotLabel(slot).toLowerCase()} on ${dateLabel(date)} that fits my goals and calories remaining.`;
      els.ariInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    els.askAriSection?.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      if (typeof window.AriNutritionPage?.sendAriMessage === "function") {
        void window.AriNutritionPage.sendAriMessage();
      }
    }, 220);
  }

  function beginPlanBuilder(date, slot) {
    const pageState = window.AriNutritionPage?.getState?.();
    if (pageState?.editingMeal) {
      window.alert("Finish the meal you are editing before adding a planned meal.");
      return;
    }

    state.planDraft = { date, slot };
    closeSheet();
    resetSharedBuilder();

    setMode("log", { force: true });
    syncSharedBuilderMode();

    const name = document.getElementById("mealName");
    name?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function saveSharedBuilderToPlan() {
    if (!state.planDraft || state.saving) return;

    const pageState = window.AriNutritionPage?.getState?.();
    if (pageState?.selectedFood) {
      const calculation = window.AriNutritionPage?.calculateSelectedFood?.();
      if (calculation && calculation.ok === false) {
        window.alert(calculation?.error?.message || "Choose a valid serving first.");
        return;
      }
    }

    const name = clean(document.getElementById("mealName")?.value);
    const calories = Number(document.getElementById("mealCalories")?.value);
    const protein = number(document.getElementById("mealProtein")?.value);
    const carbs = number(document.getElementById("mealCarbs")?.value);
    const fat = number(document.getElementById("mealFat")?.value);

    if (!name) {
      window.alert("Enter a food or meal name.");
      return;
    }
    if (!Number.isFinite(calories) || calories < 0) {
      window.alert("Enter a calorie amount of zero or greater.");
      return;
    }

    const refreshedState = window.AriNutritionPage?.getState?.() || pageState || {};
    const calculation = refreshedState.foodCalculation;
    let servingSize = "Planned serving";
    let multiplier = 1;

    if (calculation?.ok) {
      servingSize = clean(calculation?.requested?.servingLabel) ||
        (calculation?.requested?.amount !== undefined && calculation?.requested?.unit
          ? `${calculation.requested.amount} ${calculation.requested.unit}`
          : "Database serving");
      multiplier = number(calculation?.resolved?.multiplier, 1) || 1;
    }

    state.saving = true;
    if (els.saveButton) els.saveButton.disabled = true;

    try {
      await addPlanItem({
        plan_date: state.planDraft.date,
        meal_slot: state.planDraft.slot,
        name,
        calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        serving_size: servingSize,
        multiplier,
        source_type: "manual",
        source_ref: clean(refreshedState.selectedFood?.id)
      });

      state.planDraft = null;
      resetSharedBuilder();
      setMode("plan", { force: true });
    } finally {
      state.saving = false;
      if (els.saveButton) els.saveButton.disabled = false;
    }
  }

  async function addPlanItem(input = {}) {
    const slot = clean(input.meal_slot).toLowerCase();
    if (!SLOT_ORDER.includes(slot)) throw new Error("Invalid meal slot.");

    const date = clean(input.plan_date);
    if (!parseDateKey(date)) throw new Error("Invalid plan date.");

    const record = {
      plan_date: date,
      meal_slot: slot,
      name: clean(input.name) || "Planned meal",
      calories: Math.max(0, Math.round(number(input.calories))),
      protein_g: Math.max(0, roundMacro(input.protein_g)),
      carbs_g: Math.max(0, roundMacro(input.carbs_g)),
      fat_g: Math.max(0, roundMacro(input.fat_g)),
      serving_size: clean(input.serving_size) || "Planned serving",
      multiplier: Math.max(0.01, number(input.multiplier, 1) || 1),
      source_type: ["manual", "recent", "saved_meal", "recipe", "ari"].includes(clean(input.source_type)) ? clean(input.source_type) : "manual",
      source_ref: clean(input.source_ref) || null,
      recipe_id: clean(input.recipe_id) || null,
      items: Array.isArray(input.items) ? input.items : [],
      notes: clean(input.notes),
      status: "planned",
      position: Number.isFinite(Number(input.position)) ? Number(input.position) : 0,
      updated_at: new Date().toISOString()
    };

    const user = await getUser();
    const client = window.calbuddySupabase;
    let saved = null;

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_plan_items")
        .insert({ user_id: user.id, ...record })
        .select("*")
        .single();

      if (!error && data) saved = { ...data, storage_source: "supabase" };
      else console.warn("[ARI Meal Planner] Plan save fell back locally:", error?.message || "unknown error");
    }

    if (!saved) {
      saved = {
        id: makeLocalId("plan"),
        ...record,
        created_at: new Date().toISOString(),
        storage_source: "local"
      };
      const local = localStorageArray(PLAN_LOCAL_KEY);
      local.push(saved);
      writeLocalStorageArray(PLAN_LOCAL_KEY, local);
    }

    if (saved.plan_date >= state.weekStart && saved.plan_date <= weekEndKey()) {
      state.items.push(saved);
    }

    renderAll();
    dispatchPlanChanged("added", saved);
    return saved;
  }

  async function updatePlanItem(item, changes = {}) {
    if (!item?.id) return null;
    const updatedAt = new Date().toISOString();
    let updated = { ...item, ...changes, updated_at: updatedAt };

    if (item.storage_source === "supabase" && window.calbuddySupabase) {
      let query = window.calbuddySupabase
        .from("nutrition_plan_items")
        .update({ ...changes, updated_at: updatedAt })
        .eq("id", item.id);
      if (state.user?.id) query = query.eq("user_id", state.user.id);
      const { data, error } = await query.select("*").single();
      if (error) throw error;
      updated = { ...data, storage_source: "supabase" };
    } else {
      const local = localStorageArray(PLAN_LOCAL_KEY);
      const index = local.findIndex((entry) => String(entry.id) === String(item.id));
      if (index >= 0) {
        local[index] = { ...local[index], ...changes, updated_at: updatedAt, storage_source: "local" };
        writeLocalStorageArray(PLAN_LOCAL_KEY, local);
        updated = local[index];
      }
    }

    const stateIndex = state.items.findIndex((entry) => String(entry.id) === String(item.id));
    if (stateIndex >= 0) state.items[stateIndex] = updated;
    renderAll();
    dispatchPlanChanged("updated", updated);
    return updated;
  }

  async function deletePlanItem(item) {
    if (!item?.id) return;
    if (!window.confirm(`Remove ${item.name || "this item"} from the meal plan?`)) return;

    if (item.storage_source === "supabase" && window.calbuddySupabase) {
      let query = window.calbuddySupabase.from("nutrition_plan_items").delete().eq("id", item.id);
      if (state.user?.id) query = query.eq("user_id", state.user.id);
      const { error } = await query;
      if (error) throw error;
    } else {
      writeLocalStorageArray(
        PLAN_LOCAL_KEY,
        localStorageArray(PLAN_LOCAL_KEY).filter((entry) => String(entry.id) !== String(item.id))
      );
    }

    state.items = state.items.filter((entry) => String(entry.id) !== String(item.id));
    renderAll();
    dispatchPlanChanged("deleted", item);
  }

  function createMealTimestamp(dateKey, slot) {
    const date = parseDateKey(dateKey) || new Date();
    const [hour, minute] = (SLOT_TIMES[slot] || "12:00").split(":").map(Number);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  async function confirmLogAsEaten(item) {
    if (!item || item.status === "eaten") return;
    if (!window.confirm(`Log ${item.name} as eaten?`)) return;
    await logPlanItemsAsEaten([item]);
  }

  async function logPlanItemsAsEaten(items) {
    const plannedItems = (Array.isArray(items) ? items : []).filter((item) => item && item.status !== "eaten");
    if (!plannedItems.length) return { success: false, reply: "That planned meal is already logged." };

    const user = await getUser();
    const client = window.calbuddySupabase;
    const savedMeals = [];

    for (const item of plannedItems) {
      const mealRecord = {
        name: item.name || "Planned meal",
        calories: Math.max(0, Math.round(number(item.calories))),
        category: slotLabel(item.meal_slot),
        nutrition_date: item.plan_date,
        protein_g: Math.max(0, roundMacro(item.protein_g)),
        carbs_g: Math.max(0, roundMacro(item.carbs_g)),
        fat_g: Math.max(0, roundMacro(item.fat_g)),
        serving_size: item.serving_size || "Planned serving",
        multiplier: number(item.multiplier, 1) || 1,
        is_favorite: false,
        created_at: createMealTimestamp(item.plan_date, item.meal_slot).toISOString()
      };

      let savedMeal = null;
      if (user?.id && client) {
        const { data, error } = await client
          .from("meals")
          .insert({ user_id: user.id, ...mealRecord })
          .select("*")
          .single();
        if (!error && data) savedMeal = { ...data, source: "supabase" };
        else console.warn("[ARI Meal Planner] Meal log fell back locally:", error?.message || "unknown error");
      }

      if (!savedMeal) {
        const localMeals = localStorageArray("calbuddyMeals");
        savedMeal = { id: makeLocalId("meal"), ...mealRecord, source: "local" };
        localMeals.push(savedMeal);
        writeLocalStorageArray("calbuddyMeals", localMeals);
      }

      savedMeals.push(savedMeal);
      await updatePlanItem(item, {
        status: "eaten",
        consumed_meal_id: String(savedMeal.id || "")
      });
    }

    try {
      await window.AriNutritionPage?.refresh?.();
    } catch {}

    dispatchPlanChanged("eaten", plannedItems);
    window.dispatchEvent(new CustomEvent("ari:mealLogged", { detail: { source: "meal_plan", meals: savedMeals } }));

    return {
      success: true,
      meals: savedMeals,
      reply: plannedItems.length === 1
        ? `${plannedItems[0].name} is logged as eaten.`
        : `${plannedItems.length} planned items are logged as eaten.`
    };
  }

  async function getPlannedSlot(date, slot) {
    const dateKey = clean(date);
    const mealSlot = clean(slot).toLowerCase();
    if (!parseDateKey(dateKey) || !SLOT_ORDER.includes(mealSlot)) return [];

    const loaded = state.items.filter((item) =>
      item.plan_date === dateKey &&
      item.meal_slot === mealSlot &&
      item.status === "planned"
    );
    if (loaded.length) return loaded;

    const user = await getUser();
    const client = window.calbuddySupabase;
    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_plan_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_date", dateKey)
        .eq("meal_slot", mealSlot)
        .eq("status", "planned")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true });

      if (!error) return (data || []).map((item) => ({ ...item, storage_source: "supabase" }));
      console.warn("[ARI Meal Planner] Planned slot lookup failed:", error.message);
    }

    return localStorageArray(PLAN_LOCAL_KEY)
      .filter((item) => item.plan_date === dateKey && item.meal_slot === mealSlot && item.status === "planned")
      .map((item) => ({ ...item, storage_source: "local" }));
  }

  async function logSlotAsEaten(date, slot) {
    const items = await getPlannedSlot(date, slot);
    if (!items.length) return { success: false, reply: `There is no planned ${slotLabel(slot).toLowerCase()} to log.` };
    return await logPlanItemsAsEaten(items);
  }

  function dispatchPlanChanged(action, payload) {
    window.dispatchEvent(new CustomEvent("ari:nutritionMealPlanChanged", {
      detail: { action, payload, version: VERSION }
    }));
  }

  async function saveRecipe(recipe = {}) {
    const record = {
      name: clean(recipe.name) || "Recipe",
      description: clean(recipe.description),
      servings: Math.max(.25, number(recipe.servings, 1) || 1),
      calories_per_serving: Math.max(0, Math.round(number(recipe.calories_per_serving ?? recipe.calories))),
      protein_g_per_serving: Math.max(0, roundMacro(recipe.protein_g_per_serving ?? recipe.protein_g)),
      carbs_g_per_serving: Math.max(0, roundMacro(recipe.carbs_g_per_serving ?? recipe.carbs_g)),
      fat_g_per_serving: Math.max(0, roundMacro(recipe.fat_g_per_serving ?? recipe.fat_g)),
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
      source_type: clean(recipe.source_type) === "ari" ? "ari" : "manual",
      is_favorite: recipe.is_favorite === true,
      updated_at: new Date().toISOString()
    };

    const user = await getUser();
    const client = window.calbuddySupabase;
    let saved = null;

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_recipes")
        .insert({ user_id: user.id, ...record })
        .select("*")
        .single();
      if (!error && data) saved = { ...data, storage_source: "supabase" };
      else console.warn("[ARI Meal Planner] Recipe save fell back locally:", error?.message || "unknown error");
    }

    if (!saved) {
      saved = { id: makeLocalId("recipe"), ...record, created_at: new Date().toISOString(), storage_source: "local" };
      const local = localStorageArray(RECIPE_LOCAL_KEY);
      local.unshift(saved);
      writeLocalStorageArray(RECIPE_LOCAL_KEY, local);
    }

    state.recipes.unshift(saved);
    dispatchPlanChanged("recipe_saved", saved);
    return saved;
  }

  async function addRecipeToPlan(recipe, date, slot, servings = 1) {
    const amount = Math.max(.25, number(servings, 1) || 1);
    return await addPlanItem({
      plan_date: date,
      meal_slot: slot,
      name: recipe.name || "Recipe",
      calories: number(recipe.calories_per_serving) * amount,
      protein_g: number(recipe.protein_g_per_serving) * amount,
      carbs_g: number(recipe.carbs_g_per_serving) * amount,
      fat_g: number(recipe.fat_g_per_serving) * amount,
      serving_size: `${amount} serving${amount === 1 ? "" : "s"}`,
      multiplier: amount,
      source_type: "recipe",
      source_ref: clean(recipe.id),
      recipe_id: clean(recipe.id) || null,
      items: Array.isArray(recipe.ingredients) ? recipe.ingredients : []
    });
  }

  async function openRecipeLibrary(slot = null, fromAddSheet = false) {
    state.sheetSlot = slot;
    await loadRecipes();
    openSheet("My Recipes", slot ? `${dateLabel(state.selectedDate)} · ${slotLabel(slot)}` : "Saved Recipes");
    if (!els.sheetBody) return;
    els.sheetBody.replaceChildren();

    if (fromAddSheet) els.sheetBody.appendChild(renderSheetBack());

    const list = document.createElement("div");
    list.className = "nutrition-plan-sheet-list";

    if (!state.recipes.length) {
      const empty = document.createElement("div");
      empty.className = "nutrition-plan-sheet-empty";
      empty.innerHTML = `No saved recipes yet.<br>Ask Ari for taco night, pasta, salmon, carne asada, or anything else you want to cook.`;
      list.appendChild(empty);

      const ask = document.createElement("button");
      ask.type = "button";
      ask.className = "nutrition-plan-sheet-item";
      ask.innerHTML = `<span><strong>Ask Ari for a recipe</strong><small>Ari can calculate nutrition per serving too.</small></span><strong>›</strong>`;
      ask.addEventListener("click", askAriForRecipe);
      list.appendChild(ask);
    } else {
      state.recipes.forEach((recipe) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "nutrition-plan-sheet-item";
        button.innerHTML = `
          <span>
            <strong>${escapeHtml(recipe.name || "Recipe")}</strong>
            <small>${Math.round(number(recipe.calories_per_serving))} kcal/serving · ${roundMacro(recipe.protein_g_per_serving)}P · ${roundMacro(recipe.carbs_g_per_serving)}C · ${roundMacro(recipe.fat_g_per_serving)}F</small>
          </span>
          <strong>›</strong>
        `;
        button.addEventListener("click", () => {
          if (state.sheetSlot) {
            void addRecipeToPlan(recipe, state.selectedDate, state.sheetSlot, 1).then(closeSheet);
          } else {
            renderRecipeSlotPicker(recipe);
          }
        });
        list.appendChild(button);
      });
    }

    els.sheetBody.appendChild(list);
  }

  function renderRecipeSlotPicker(recipe) {
    if (!els.sheetBody) return;
    els.sheetBody.replaceChildren();
    const back = document.createElement("button");
    back.type = "button";
    back.className = "nutrition-plan-sheet-back";
    back.textContent = "‹ My Recipes";
    back.addEventListener("click", () => openRecipeLibrary(null));
    els.sheetBody.appendChild(back);

    const grid = document.createElement("div");
    grid.className = "nutrition-plan-choice-grid";
    SLOT_ORDER.forEach((slot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "nutrition-plan-choice";
      button.innerHTML = `<strong>${slotLabel(slot)}</strong><span>${dateLabel(state.selectedDate)}</span>`;
      button.addEventListener("click", async () => {
        await addRecipeToPlan(recipe, state.selectedDate, slot, 1);
        closeSheet();
      });
      grid.appendChild(button);
    });
    els.sheetBody.appendChild(grid);
  }

  function askAriForRecipe() {
    closeSheet();
    setMode("log");
    if (els.ariInput) {
      els.ariInput.value = "Create a delicious recipe for me with calories, protein, carbs, and fat per serving. Ask me what style of meal I want if you need to.";
      els.ariInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    els.askAriSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function saveCurrentWeekTemplate() {
    const weekItems = state.items.filter((item) => item.plan_date >= state.weekStart && item.plan_date <= weekEndKey() && item.status !== "skipped");
    if (!weekItems.length) {
      window.alert("Add at least one meal before saving this week as a plan.");
      return;
    }

    const name = clean(window.prompt("Name this meal plan", "My Week"));
    if (!name) return;

    const start = parseDateKey(state.weekStart);
    const templateItems = weekItems.map((item) => {
      const date = parseDateKey(item.plan_date);
      const dayOffset = Math.round((date - start) / 86400000);
      return {
        day_offset: dayOffset,
        meal_slot: item.meal_slot,
        name: item.name,
        calories: number(item.calories),
        protein_g: number(item.protein_g),
        carbs_g: number(item.carbs_g),
        fat_g: number(item.fat_g),
        serving_size: item.serving_size || "Planned serving",
        multiplier: number(item.multiplier, 1) || 1,
        source_type: item.source_type || "manual",
        source_ref: item.source_ref || null,
        recipe_id: item.recipe_id || null,
        items: Array.isArray(item.items) ? item.items : [],
        notes: item.notes || ""
      };
    });

    const record = {
      name,
      template: { version: 1, items: templateItems },
      updated_at: new Date().toISOString()
    };

    const user = await getUser();
    const client = window.calbuddySupabase;
    let saved = null;

    if (user?.id && client) {
      const { data, error } = await client
        .from("nutrition_plan_templates")
        .insert({ user_id: user.id, ...record })
        .select("*")
        .single();
      if (!error && data) saved = { ...data, storage_source: "supabase" };
      else console.warn("[ARI Meal Planner] Template save fell back locally:", error?.message || "unknown error");
    }

    if (!saved) {
      saved = { id: makeLocalId("template"), ...record, created_at: new Date().toISOString(), storage_source: "local" };
      const local = localStorageArray(TEMPLATE_LOCAL_KEY);
      local.unshift(saved);
      writeLocalStorageArray(TEMPLATE_LOCAL_KEY, local);
    }

    state.templates.unshift(saved);
    window.alert(`${name} was saved.`);
  }

  async function openSavedPlans() {
    await loadTemplates();
    openSheet("Saved Plans", "Reuse a Week");
    if (!els.sheetBody) return;
    els.sheetBody.replaceChildren();

    const list = document.createElement("div");
    list.className = "nutrition-plan-sheet-list";

    if (!state.templates.length) {
      list.innerHTML = `<div class="nutrition-plan-sheet-empty">No saved weekly plans yet. Build a week, then tap Save Week.</div>`;
    } else {
      state.templates.forEach((template) => {
        const card = document.createElement("article");
        card.className = "nutrition-template-card";
        const count = Array.isArray(template?.template?.items) ? template.template.items.length : 0;
        card.innerHTML = `
          <div class="nutrition-template-card__top"><h4>${escapeHtml(template.name || "Meal Plan")}</h4><span>${count} items</span></div>
          <p>Apply this plan to ${escapeHtml(weekLabel())}.</p>
          <div class="nutrition-template-card__actions">
            <button type="button" data-template-action="apply">Apply</button>
            <button type="button" data-template-action="delete">Delete</button>
          </div>
        `;
        card.querySelector('[data-template-action="apply"]')?.addEventListener("click", () => void applyTemplate(template));
        card.querySelector('[data-template-action="delete"]')?.addEventListener("click", () => void deleteTemplate(template));
        list.appendChild(card);
      });
    }

    els.sheetBody.appendChild(list);
  }

  async function applyTemplate(template) {
    const items = Array.isArray(template?.template?.items) ? template.template.items : [];
    if (!items.length) return;
    if (!window.confirm(`Add ${template.name || "this plan"} to ${weekLabel()}? Existing planned meals will stay.`)) return;

    for (const item of items) {
      const date = formatDateKey(addDays(state.weekStart, number(item.day_offset)));
      await addPlanItem({ ...item, plan_date: date, status: "planned" });
    }

    closeSheet();
    renderAll();
  }

  async function deleteTemplate(template) {
    if (!template?.id || !window.confirm(`Delete ${template.name || "this saved plan"}?`)) return;

    if (template.storage_source === "supabase" && window.calbuddySupabase) {
      let query = window.calbuddySupabase.from("nutrition_plan_templates").delete().eq("id", template.id);
      if (state.user?.id) query = query.eq("user_id", state.user.id);
      const { error } = await query;
      if (error) throw error;
    } else {
      writeLocalStorageArray(
        TEMPLATE_LOCAL_KEY,
        localStorageArray(TEMPLATE_LOCAL_KEY).filter((entry) => String(entry.id) !== String(template.id))
      );
    }

    state.templates = state.templates.filter((entry) => String(entry.id) !== String(template.id));
    await openSavedPlans();
  }

  async function addGeneratedMeals(meals = []) {
    const saved = [];
    for (const meal of Array.isArray(meals) ? meals : []) {
      const date = clean(meal.plan_date || meal.date || state.selectedDate);
      const slot = clean(meal.meal_slot || meal.slot || meal.category).toLowerCase();
      if (!parseDateKey(date) || !SLOT_ORDER.includes(slot)) continue;
      saved.push(await addPlanItem({
        plan_date: date,
        meal_slot: slot,
        name: meal.name || "Ari meal",
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        serving_size: meal.serving_size || "Planned by Ari",
        multiplier: meal.multiplier || 1,
        source_type: "ari",
        items: Array.isArray(meal.items) ? meal.items : []
      }));
    }
    return saved;
  }

  function findPlannedSlot(date, slot) {
    return state.items.filter((item) => item.plan_date === date && item.meal_slot === slot && item.status === "planned");
  }

  function getAriContext(date = state.selectedDate) {
    const goal = dailyGoal();
    const consumed = consumedCaloriesForDate(date);
    const plannedItems = state.items.filter((item) => item.plan_date === date && item.status !== "skipped");
    const plannedCalories = plannedItems.reduce((sum, item) => sum + number(item.calories), 0);
    let macroTargets = null;
    try {
      const parsed = JSON.parse(localStorage.getItem(DAILY_TARGETS_KEY) || "null");
      if (parsed && typeof parsed === "object") macroTargets = parsed;
    } catch {}

    return {
      date,
      calorieGoal: goal,
      consumedCalories: consumed,
      plannedCalories,
      remainingCalories: goal ? Math.max(0, goal - consumed - plannedCalories) : null,
      macroTargets,
      plannedMeals: plannedItems.map((item) => ({
        id: item.id,
        slot: item.meal_slot,
        name: item.name,
        calories: number(item.calories),
        protein_g: number(item.protein_g),
        carbs_g: number(item.carbs_g),
        fat_g: number(item.fat_g),
        status: item.status
      }))
    };
  }

  async function refresh() {
    await Promise.all([loadWeekItems(), loadRecipes(), loadTemplates()]);
    renderAll();
  }

  function installPublicApi() {
    window.AriNutritionMealPlanner = Object.freeze({
      version: VERSION,
      setMode,
      refresh,
      addPlanItem,
      addGeneratedMeals,
      saveRecipe,
      addRecipeToPlan,
      logSlotAsEaten,
      logPlanItemsAsEaten,
      findPlannedSlot,
      getPlannedSlot,
      getAriContext,
      getState() {
        return {
          mode: state.mode,
          selectedDate: state.selectedDate,
          weekStart: state.weekStart,
          items: state.items.map((item) => ({ ...item })),
          recipes: state.recipes.map((recipe) => ({ ...recipe })),
          templates: state.templates.map((template) => ({ ...template }))
        };
      }
    });
  }

  function bindExternalEvents() {
    window.addEventListener("ari:nutritionMealPlanRefresh", () => void refresh());
    window.addEventListener("focus", () => {
      if (state.mode === "plan") void refresh();
    });
  }

  async function boot() {
    cacheElements();
    if (!els.section || !els.form || !els.saveButton) return;

    injectStylesheet();
    buildModeSwitch();
    buildPlannerWorkspace();
    buildSheet();
    bindSaveInterceptor();
    installPublicApi();
    bindExternalEvents();
    injectActionRuntime();

    await loadAll();
    setMode("log", { force: true });

    console.info(`[ARI Nutrition Meal Planner] Ready. Version ${VERSION}.`);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void boot(), { once: true });
  } else {
    void boot();
  }
})();
