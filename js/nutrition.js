// =====================================================
// ARI REBIRTH
// File: nutrition.js
// Version: 4.0.0
// Purpose:
//   Functional controller for the simplified Nutrition page.
//
// Features:
//   - Ask Ari conversation using CalBuddy.askAri()
//   - Manual meal entry
//   - Supabase meal saving with local fallback
//   - Today's meals and deletion
//   - Today's calorie, protein, carb, and fat totals
//   - Recent meals
//   - User-configured nutrition reset window
//
// Removed by design:
//   - USDA search
//   - Keyword-based meal estimation
//   - Favorites
//   - Repeat meal
//   - Micronutrient summaries
// =====================================================

const nutritionState = {
  chatHistory: [],
  mealsToday: [],
  recentMeals: [],
  totals: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  },
  ariBusy: false,
  savingMeal: false,
  currentUser: null,
  currentWindow: null
};

const NUTRITION_LOCAL_MEALS_KEY = "calbuddyMeals";
const NUTRITION_CHAT_HISTORY_LIMIT = 10;
const NUTRITION_RECENT_MEAL_LIMIT = 12;

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    bindNutritionNavigation();
    bindNutritionComposer();
    bindManualMealEntry();

    await setupNutritionAuth();

    nutritionState.currentUser = await getNutritionUser();
    nutritionState.currentWindow = await getNutritionWindow();

    await refreshNutritionPage();
  } catch (error) {
    console.error("[ARI NUTRITION INIT ERROR]", error);
    showNutritionNotice(
      error?.message || "The Nutrition page could not finish loading.",
      "error"
    );
  }
});

async function refreshNutritionPage() {
  await loadTodayMeals();
  await loadRecentMeals();
}

// =====================================================
// NAVIGATION
// =====================================================

function bindNutritionNavigation() {
  window.goBack = goBack;
  window.goHome = goHome;
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.replace("home.html");
}

function goHome() {
  window.location.replace("home.html");
}

// =====================================================
// AUTHENTICATION
// =====================================================

async function setupNutritionAuth() {
  if (typeof window.requireAuth === "function") {
    await window.requireAuth();
    return;
  }

  if (!window.calbuddySupabase) return;

  const { data, error } =
    await window.calbuddySupabase.auth.getSession();

  if (error) {
    console.warn("Nutrition auth session lookup failed:", error.message);
    return;
  }

  if (!data?.session) {
    window.location.replace("signin.html");
  }
}

async function getNutritionUser() {
  if (typeof window.getCurrentUser === "function") {
    try {
      return await window.getCurrentUser();
    } catch (error) {
      console.warn("getCurrentUser failed:", error.message);
    }
  }

  if (!window.calbuddySupabase) return null;

  const { data, error } =
    await window.calbuddySupabase.auth.getSession();

  if (error || !data?.session) return null;

  return data.session.user;
}

// =====================================================
// ASK ARI COMPOSER
// =====================================================

function bindNutritionComposer() {
  const input = getElement("ariInput");
  const button = getElement("ariSendBtn");

  if (!input || !button) return;

  button.addEventListener("click", sendAriMessage);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendAriMessage();
    }
  });

  input.addEventListener("input", autoResizeNutritionInput);
}

async function sendAriMessage() {
  if (nutritionState.ariBusy) return;

  const input = getElement("ariInput");
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  if (typeof window.CalBuddy?.askAri !== "function") {
    addConversationMessage(
      "Ari is not available on this page. Check that calbuddy-core.js and the ARI App Bridge loaded correctly.",
      "ari"
    );
    return;
  }

  input.value = "";
  autoResizeNutritionInput();

  addConversationMessage(message, "user");

  nutritionState.chatHistory.push({
    role: "user",
    content: message
  });

  nutritionState.chatHistory =
    nutritionState.chatHistory.slice(-NUTRITION_CHAT_HISTORY_LIMIT);

  setNutritionComposerBusy(true);
  const thinkingMessage = addThinkingMessage();

  try {
    const result = await window.CalBuddy.askAri({
      message,
      history: nutritionState.chatHistory,
      appContext: {
        page: "nutrition",
        currentPage: "nutrition"
      },
      debugTiming: true
    });

    thinkingMessage?.remove();

    const reply = String(
      result?.reply ||
      result?.text ||
      result?.message ||
      "I couldn't generate a complete response."
    ).trim();

    addConversationMessage(reply, "ari");

    nutritionState.chatHistory.push({
      role: "assistant",
      content: reply
    });

    nutritionState.chatHistory =
      nutritionState.chatHistory.slice(-NUTRITION_CHAT_HISTORY_LIMIT);
  } catch (error) {
    thinkingMessage?.remove();

    addConversationMessage(
      error?.message || "Something went wrong while Ari was answering.",
      "ari"
    );
  } finally {
    setNutritionComposerBusy(false);
  }
}

function addConversationMessage(text, sender = "ari") {
  const thread = getElement("ariMessages");
  if (!thread) return null;

  const message = document.createElement("div");
  message.className =
    `ari-message ${sender === "user" ? "ari-user" : "ari-ai"}`;

  const label = document.createElement("span");
  label.className = "ari-message-label";
  label.textContent = sender === "user" ? "You" : "Ari";

  const body = document.createElement("p");
  body.textContent = String(text || "");
  body.style.whiteSpace = "pre-wrap";

  message.append(label, body);
  thread.appendChild(message);

  requestAnimationFrame(() => {
    message.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  });

  return message;
}

function addThinkingMessage() {
  const message = addConversationMessage("", "ari");
  if (!message) return null;

  const body = message.querySelector("p");

  if (body) {
    body.innerHTML = `
      <span class="ari-typing-dots" aria-label="Ari is thinking">
        <span></span><span></span><span></span>
      </span>
    `;
  }

  return message;
}

function setNutritionComposerBusy(isBusy) {
  nutritionState.ariBusy = isBusy;

  const input = getElement("ariInput");
  const button = getElement("ariSendBtn");
  const shell = document.querySelector(".ari-input-shell");

  if (input) {
    input.disabled = isBusy;
    input.placeholder = isBusy
      ? "Ari is thinking..."
      : "Ask Ari about nutrition...";
  }

  if (button) {
    button.disabled = isBusy;
    button.setAttribute("aria-busy", String(isBusy));
    button.textContent = isBusy ? "\u2026" : "\u27A4";
  }

  shell?.classList.toggle("thinking", isBusy);

  if (!isBusy) {
    input?.focus();
  }
}

function autoResizeNutritionInput() {
  const input = getElement("ariInput");
  if (!input) return;

  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
}

// =====================================================
// MANUAL MEAL ENTRY
// =====================================================

function bindManualMealEntry() {
  const button = getElement("saveMealBtn");
  if (!button) return;

  button.addEventListener("click", saveManualMeal);
}

async function saveManualMeal() {
  if (nutritionState.savingMeal) return;

  const meal = readManualMealForm();
  const validationError = validateManualMeal(meal);

  if (validationError) {
    showNutritionNotice(validationError, "error");
    return;
  }

  nutritionState.savingMeal = true;
  setManualSaveBusy(true);

  try {
    nutritionState.currentUser =
      nutritionState.currentUser || await getNutritionUser();

    nutritionState.currentWindow =
      nutritionState.currentWindow || await getNutritionWindow();

    const record = buildMealRecord(meal);
    const saveResult = await saveMealRecord(record);

    clearManualMealForm();

    showNutritionNotice(
      saveResult.savedToCloud
        ? `${record.name} was saved.`
        : `${record.name} was saved on this device.`,
      "success"
    );

    await refreshNutritionPage();
  } catch (error) {
    console.error("[NUTRITION SAVE ERROR]", error);

    showNutritionNotice(
      error?.message || "The meal could not be saved.",
      "error"
    );
  } finally {
    nutritionState.savingMeal = false;
    setManualSaveBusy(false);
  }
}

function readManualMealForm() {
  return {
    name: String(
      getElement("mealName", "manualFoodName")?.value || ""
    ).trim(),

    calories: toNumber(
      getElement("mealCalories", "manualCalories")?.value
    ),

    protein_g: toNumber(
      getElement("mealProtein", "manualProtein")?.value
    ),

    carbs_g: toNumber(
      getElement("mealCarbs", "manualCarbs")?.value
    ),

    fat_g: toNumber(
      getElement("mealFat", "manualFat")?.value
    ),

    category: String(
      getElement("mealType", "manualCategory")?.value || "Meal"
    ).trim()
  };
}

function validateManualMeal(meal) {
  if (!meal.name) {
    return "Enter a food or meal name.";
  }

  if (!Number.isFinite(meal.calories) || meal.calories <= 0) {
    return "Enter a calorie amount greater than zero.";
  }

  const macroValues = [meal.protein_g, meal.carbs_g, meal.fat_g];

  if (macroValues.some((value) => !Number.isFinite(value) || value < 0)) {
    return "Protein, carbs, and fat cannot be negative.";
  }

  return "";
}

function buildMealRecord(meal) {
  const now = new Date();
  const currentWindow = nutritionState.currentWindow;

  return {
    name: meal.name,
    calories: Math.round(meal.calories),
    category: meal.category || "Meal",
    nutrition_date:
      currentWindow?.nutritionDate || formatLocalDate(now),
    protein_g: roundMacro(meal.protein_g),
    carbs_g: roundMacro(meal.carbs_g),
    fat_g: roundMacro(meal.fat_g),
    serving_size: "Manual entry",
    multiplier: 1,
    is_favorite: false,
    created_at: now.toISOString()
  };
}

async function saveMealRecord(record) {
  const user = nutritionState.currentUser;

  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("meals")
      .insert({
        user_id: user.id,
        ...record
      })
      .select("*")
      .single();

    if (!error && data) {
      return {
        meal: { ...data, source: "supabase" },
        savedToCloud: true
      };
    }

    console.warn(
      "Supabase meal save failed; using local fallback:",
      error?.message || "Unknown database error"
    );
  }

  const localMeal = saveMealLocally(record);

  return {
    meal: localMeal,
    savedToCloud: false
  };
}

function saveMealLocally(record) {
  const meals = readLocalMeals();

  const localMeal = {
    id: `local-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...record,
    source: "local"
  };

  meals.push(localMeal);
  writeLocalMeals(meals);

  return localMeal;
}

function clearManualMealForm() {
  [
    "mealName",
    "manualFoodName",
    "mealCalories",
    "manualCalories",
    "mealProtein",
    "manualProtein",
    "mealCarbs",
    "manualCarbs",
    "mealFat",
    "manualFat"
  ].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = "";
  });
}

function setManualSaveBusy(isBusy) {
  const button = getElement("saveMealBtn");
  if (!button) return;

  button.disabled = isBusy;
  button.setAttribute("aria-busy", String(isBusy));
  button.textContent = isBusy ? "Saving..." : "Save Meal";
}

// =====================================================
// TODAY'S MEALS
// =====================================================

async function loadTodayMeals() {
  nutritionState.currentWindow = await getNutritionWindow();

  const cloudMeals = await getCloudMealsInWindow(
    nutritionState.currentWindow
  );

  const localMeals = getLocalMealsInWindow(
    nutritionState.currentWindow
  );

  nutritionState.mealsToday = mergeMealCollections(
    cloudMeals,
    localMeals
  ).sort(compareMealsOldestFirst);

  calculateNutritionTotals();
  renderTodayMeals();
  renderTodayNutrition();
}

async function getCloudMealsInWindow(windowInfo) {
  const user = nutritionState.currentUser;

  if (!user || !window.calbuddySupabase || !windowInfo) {
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
    console.warn("Today's cloud meals could not load:", error.message);
    return [];
  }

  return (data || []).map((meal) => ({
    ...meal,
    source: "supabase"
  }));
}

function getLocalMealsInWindow(windowInfo) {
  if (!windowInfo) return [];

  return readLocalMeals()
    .filter((meal) => {
      const createdAt = getMealDate(meal);

      return createdAt >= windowInfo.start && createdAt < windowInfo.end;
    })
    .map((meal) => ({
      ...meal,
      source: "local"
    }));
}

function renderTodayMeals() {
  const container = getElement(
    "todayMealList",
    "todayMealsList",
    "todayIntakeItems"
  );

  if (!container) return;

  container.replaceChildren();

  if (!nutritionState.mealsToday.length) {
    const empty = document.createElement("p");
    empty.className = "nutrition-empty-state";
    empty.textContent = "No meals have been logged today.";
    container.appendChild(empty);
    return;
  }

  nutritionState.mealsToday.forEach((meal) => {
    container.appendChild(createTodayMealCard(meal));
  });
}

function createTodayMealCard(meal) {
  const card = document.createElement("article");
  card.className = "nutrition-meal-card";
  card.dataset.mealId = String(meal.id || "");

  const heading = document.createElement("div");
  heading.className = "nutrition-meal-card-header";

  const titleGroup = document.createElement("div");

  const title = document.createElement("h3");
  title.textContent = meal.name || "Meal";

const meta = document.createElement("p");
meta.className = "nutrition-meal-meta";
meta.textContent = [
  meal.category || "Meal",
  formatMealTime(meal)
].filter(Boolean).join(" \u2022 ");

  titleGroup.append(title, meta);

  const calories = document.createElement("strong");
  calories.className = "nutrition-meal-calories";
  calories.textContent = `${Math.round(toNumber(meal.calories))} kcal`;

  heading.append(titleGroup, calories);

  const macros = document.createElement("p");
macros.className = "nutrition-meal-macros";
macros.textContent = [
  `${roundMacro(readMealMacro(meal, "protein"))}g protein`,
  `${roundMacro(readMealMacro(meal, "carbs"))}g carbs`,
  `${roundMacro(readMealMacro(meal, "fat"))}g fat`
].join(" \u2022 ");

  const actions = document.createElement("div");
  actions.className = "nutrition-meal-actions";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "nutrition-delete-meal-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", () => deleteMeal(meal));

  actions.appendChild(deleteButton);
  card.append(heading, macros, actions);

  return card;
}

async function deleteMeal(meal) {
  if (!meal?.id) return;

  const deleteConfirmed = window.confirm(
    `Delete ${meal.name || "this meal"}?`
  );

  if (!deleteConfirmed) return;

  try {
    if (meal.source === "supabase" && window.calbuddySupabase) {
      let query = window.calbuddySupabase
        .from("meals")
        .delete()
        .eq("id", meal.id);

      if (nutritionState.currentUser?.id) {
        query = query.eq("user_id", nutritionState.currentUser.id);
      }

      const { error } = await query;

      if (error) throw error;
    } else {
      const meals = readLocalMeals().filter(
        (item) => String(item.id) !== String(meal.id)
      );

      writeLocalMeals(meals);
    }

    showNutritionNotice("Meal deleted.", "success");
    await refreshNutritionPage();
  } catch (error) {
    console.error("[NUTRITION DELETE ERROR]", error);

    showNutritionNotice(
      error?.message || "The meal could not be deleted.",
      "error"
    );
  }
}

// =====================================================
// TODAY'S NUTRITION
// =====================================================

function calculateNutritionTotals() {
  nutritionState.totals = nutritionState.mealsToday.reduce(
    (totals, meal) => {
      totals.calories += toNumber(meal.calories);
      totals.protein += readMealMacro(meal, "protein");
      totals.carbs += readMealMacro(meal, "carbs");
      totals.fat += readMealMacro(meal, "fat");
      return totals;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
  );

  localStorage.setItem(
    "calbuddyCaloriesConsumed",
    String(Math.round(nutritionState.totals.calories))
  );
}

function renderTodayNutrition() {
  updateNutritionMetric(
    ["totalCalories", "todayCalories", "totalConsumedText"],
    "Calories",
    `${Math.round(nutritionState.totals.calories).toLocaleString()} kcal`
  );

  updateNutritionMetric(
    ["totalProtein", "todayProtein", "totalProteinText"],
    "Protein",
    `${roundMacro(nutritionState.totals.protein)} g`
  );

  updateNutritionMetric(
    ["totalCarbs", "todayCarbs", "totalCarbsText"],
    "Carbs",
    `${roundMacro(nutritionState.totals.carbs)} g`
  );

  updateNutritionMetric(
    ["totalFat", "todayFat", "totalFatText"],
    "Fat",
    `${roundMacro(nutritionState.totals.fat)} g`
  );
}

function updateNutritionMetric(ids, label, value) {
  const element = getElement(...ids);
  if (!element) return;

  const tagName = element.tagName.toLowerCase();

  if (["strong", "span", "output"].includes(tagName)) {
    element.textContent = value;
    return;
  }

  const existingValue = element.querySelector("strong, output");

  if (existingValue) {
    existingValue.textContent = value;
    return;
  }

  element.replaceChildren();

  const labelElement = document.createElement("span");
  labelElement.textContent = label;

  const valueElement = document.createElement("strong");
  valueElement.textContent = value;

  element.append(labelElement, valueElement);
}

// =====================================================
// RECENT MEALS
// =====================================================

async function loadRecentMeals() {
  const cloudMeals = await getRecentCloudMeals();
  const localMeals = readLocalMeals();

  nutritionState.recentMeals = mergeMealCollections(
    cloudMeals,
    localMeals
  )
    .sort(compareMealsNewestFirst)
    .slice(0, NUTRITION_RECENT_MEAL_LIMIT);

  renderRecentMeals();
}

async function getRecentCloudMeals() {
  const user = nutritionState.currentUser;

  if (!user || !window.calbuddySupabase) return [];

  const { data, error } = await window.calbuddySupabase
    .from("meals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(NUTRITION_RECENT_MEAL_LIMIT);

  if (error) {
    console.warn("Recent cloud meals could not load:", error.message);
    return [];
  }

  return (data || []).map((meal) => ({
    ...meal,
    source: "supabase"
  }));
}

function renderRecentMeals() {
  const container = getElement("recentMealList", "recentMealsList");
  if (!container) return;

  container.replaceChildren();

  if (!nutritionState.recentMeals.length) {
    const empty = document.createElement("p");
    empty.className = "nutrition-empty-state";
    empty.textContent = "No recent meals yet.";
    container.appendChild(empty);
    return;
  }

  nutritionState.recentMeals.forEach((meal) => {
    const item = document.createElement("article");
    item.className = "nutrition-recent-meal";

    const text = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = meal.name || "Meal";

    const meta = document.createElement("p");
meta.textContent = [
  `${Math.round(toNumber(meal.calories))} kcal`,
  formatRecentMealDate(meal)
].filter(Boolean).join(" \u2022 ");

    text.append(name, meta);
    item.appendChild(text);
    container.appendChild(item);
  });
}

// =====================================================
// RESET WINDOW
// =====================================================

async function getResetTime() {
  const savedResetTime = localStorage.getItem("calbuddyResetTime");
  const user = nutritionState.currentUser || await getNutritionUser();

  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("profiles")
      .select("reset_hour, reset_minute, reset_ampm")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      const resetTime = {
        hour: toNumber(data.reset_hour, 4),
        minute: toNumber(data.reset_minute, 0),
        ampm: data.reset_ampm || "AM"
      };

      localStorage.setItem(
        "calbuddyResetTime",
        JSON.stringify(resetTime)
      );

      return resetTime;
    }
  }

  if (savedResetTime) {
    try {
      const parsed = JSON.parse(savedResetTime);

      return {
        hour: toNumber(parsed.hour, 4),
        minute: toNumber(parsed.minute, 0),
        ampm: parsed.ampm || "AM"
      };
    } catch {
      // Fall through to the default reset time.
    }
  }

  return {
    hour: 4,
    minute: 0,
    ampm: "AM"
  };
}

async function getNutritionWindow() {
  const reset = await getResetTime();
  const resetHour24 = convertTo24Hour(reset.hour, reset.ampm);
  const now = new Date();

  const start = new Date(now);
  start.setHours(resetHour24, toNumber(reset.minute), 0, 0);

  if (now < start) {
    start.setDate(start.getDate() - 1);
  }

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
    nutritionDate: formatLocalDate(start)
  };
}

function convertTo24Hour(hour, ampm) {
  const cleanHour = toNumber(hour);
  const cleanAmPm = String(ampm || "AM").toUpperCase();

  if (cleanAmPm === "AM" && cleanHour === 12) return 0;
  if (cleanAmPm === "PM" && cleanHour !== 12) return cleanHour + 12;

  return cleanHour;
}

// =====================================================
// LOCAL STORAGE
// =====================================================

function readLocalMeals() {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(NUTRITION_LOCAL_MEALS_KEY) || "[]"
    );

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMeals(meals) {
  localStorage.setItem(
    NUTRITION_LOCAL_MEALS_KEY,
    JSON.stringify(Array.isArray(meals) ? meals : [])
  );
}

// =====================================================
// NOTICES
// =====================================================

function showNutritionNotice(message, type = "info") {
  const notice = ensureNutritionNotice();
  if (!notice) return;

  notice.textContent = String(message || "");
  notice.dataset.type = type;
  notice.className = `nutrition-page-notice nutrition-notice-${type}`;
  notice.hidden = !message;

  if (message) {
    window.clearTimeout(showNutritionNotice.timeoutId);

    showNutritionNotice.timeoutId = window.setTimeout(() => {
      notice.hidden = true;
    }, 5000);
  }
}

function ensureNutritionNotice() {
  let notice = document.getElementById("nutritionPageNotice");
  if (notice) return notice;

  const manualSection = getElement("manualEntrySection");
  if (!manualSection) return null;

  notice = document.createElement("p");
  notice.id = "nutritionPageNotice";
  notice.className = "nutrition-page-notice";
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  notice.hidden = true;

  manualSection.appendChild(notice);

  return notice;
}

// =====================================================
// UTILITIES
// =====================================================

function getElement(...ids) {
  for (const id of ids) {
    const element = document.getElementById(id);
    if (element) return element;
  }

  return null;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMacro(value) {
  return Math.round(toNumber(value) * 10) / 10;
}

function readMealMacro(meal, macroName) {
  const aliases = {
    protein: ["protein_g", "protein"],
    carbs: ["carbs_g", "carbs", "carbohydrates_g", "carbohydrates"],
    fat: ["fat_g", "fat"]
  };

  for (const key of aliases[macroName] || []) {
    if (meal?.[key] !== undefined && meal?.[key] !== null) {
      return toNumber(meal[key]);
    }
  }

  return 0;
}

function getMealDate(meal) {
  const rawDate =
    meal?.created_at ||
    meal?.createdAt ||
    meal?.date ||
    meal?.nutrition_date;

  const date = new Date(rawDate);

  return Number.isNaN(date.getTime())
    ? new Date(0)
    : date;
}

function formatMealTime(meal) {
  const date = getMealDate(meal);

  if (date.getTime() === 0) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatRecentMealDate(meal) {
  const date = getMealDate(meal);

  if (date.getTime() === 0) return "";

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function mergeMealCollections(...collections) {
  const merged = [];
  const seen = new Set();

  collections.flat().forEach((meal) => {
    if (!meal) return;

    const key = [
      meal.source || "unknown",
      meal.id || "no-id",
      meal.created_at || meal.createdAt || "no-date",
      meal.name || "no-name"
    ].join("|");

    if (seen.has(key)) return;

    seen.add(key);
    merged.push(meal);
  });

  return merged;
}

function compareMealsOldestFirst(a, b) {
  return getMealDate(a) - getMealDate(b);
}

function compareMealsNewestFirst(a, b) {
  return getMealDate(b) - getMealDate(a);
}

// Optional public surface for console diagnostics.
window.AriNutritionPage = {
  version: "4.0.0",
  refresh: refreshNutritionPage,
  sendAriMessage,
  saveManualMeal,
  deleteMeal,
  getState() {
    return {
      ...nutritionState,
      chatHistory: [...nutritionState.chatHistory],
      mealsToday: [...nutritionState.mealsToday],
      recentMeals: [...nutritionState.recentMeals],
      totals: { ...nutritionState.totals }
    };
  }
};
