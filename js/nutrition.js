// =====================================================
// ARI REBIRTH
// File: nutrition.js
// Version: 3.0.0
// Purpose:
//   Nutrition Console behavior for ARI Rebirth.
//
// Part 1:
//   - State
//   - Prompt rotation
//   - Navigation
//   - Number/date helpers
//   - Auth user lookup
//   - Reset window logic
// =====================================================

let currentMode = "";
let selectedMealType = "";
let estimatedMeal = null;

const nutritionPrompts = [
  "I had two tacos and a Coke...",
  "Homemade pasta...",
  "Protein shake...",
  "Two beers...",
  "Chicken burrito for lunch...",
  "+350 calories..."
];

let promptIndex = 0;

// -----------------------------------------------------
// Navigation
// -----------------------------------------------------

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

// -----------------------------------------------------
// Prompt Rotation
// -----------------------------------------------------

function rotateNutritionPrompt() {
  const input = document.getElementById("ariNutritionInput");

  if (!input) return;
  if (document.activeElement === input) return;
  if (input.value.trim()) return;

  input.placeholder = nutritionPrompts[promptIndex % nutritionPrompts.length];
  promptIndex += 1;
}

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

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

function formatDisplayTime(date) {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function roundMacro(value) {
  const number = Number(value || 0);
  return Math.round(number * 10) / 10;
}

function convertTo24Hour(hour, ampm) {
  const cleanHour = Number(hour);

  if (ampm === "AM" && cleanHour === 12) return 0;
  if (ampm === "PM" && cleanHour !== 12) return cleanHour + 12;

  return cleanHour;
}

// -----------------------------------------------------
// Auth
// -----------------------------------------------------

async function getNutritionUser() {
  if (typeof getCurrentUser === "function") {
    return await getCurrentUser();
  }

  if (!window.calbuddySupabase) return null;

  const { data, error } = await window.calbuddySupabase.auth.getSession();

  if (error || !data.session) {
    return null;
  }

  return data.session.user;
}

// -----------------------------------------------------
// Reset Window
// -----------------------------------------------------

async function getResetTime() {
  const saved = localStorage.getItem("calbuddyResetTime");
  const user = await getNutritionUser();

  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("profiles")
      .select("reset_hour, reset_minute, reset_ampm")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      const resetTime = {
        hour: safeNumber(data.reset_hour, 4),
        minute: safeNumber(data.reset_minute, 0),
        ampm: data.reset_ampm || "AM"
      };

      localStorage.setItem("calbuddyResetTime", JSON.stringify(resetTime));

      return resetTime;
    }
  }

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return {
        hour: 4,
        minute: 0,
        ampm: "AM"
      };
    }
  }

  return {
    hour: 4,
    minute: 0,
    ampm: "AM"
  };
}

async function getNutritionWindow(offset = 0) {
  const reset = await getResetTime();
  const resetHour24 = convertTo24Hour(reset.hour, reset.ampm);

  const now = new Date();

  const start = new Date();
  start.setHours(resetHour24, Number(reset.minute), 0, 0);

  if (now < start) {
    start.setDate(start.getDate() - 1);
  }

  start.setDate(start.getDate() + offset);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const resetKey =
    `${String(resetHour24).padStart(2, "0")}${String(reset.minute).padStart(2, "0")}`;

  return {
    start,
    end,
    dateKey: `${formatLocalDate(start)}_${resetKey}`,
    nutritionDate: formatLocalDate(start)
  };
}

function updateWindowNote(windowInfo) {
  const note = document.getElementById("windowNote");

  if (!note || !windowInfo) return;

  note.textContent =
    `Reset window: ${formatDisplayTime(windowInfo.start)} – ${formatDisplayTime(windowInfo.end)}`;
}
// =====================================================
// PART 2
// AI NUTRITION CONSOLE
// =====================================================

function setStatusText(text, pillText = "") {
  const status = document.getElementById("ariNutritionStatus");
  const pill = document.getElementById("ariReadyPill");

  if (status) status.textContent = text;
  if (pill && pillText) pill.textContent = pillText;
}

function estimateFromText(text) {
  const clean = String(text || "").trim();

  const numberMatch = clean.match(/^\+?\s*(\d{2,5})\s*(cal|calories|kcal)?$/i);

  if (numberMatch) {
    const calories = Number(numberMatch[1]);

    return {
      name: "Manual calorie estimate",
      calories,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      serving_size: "Ari quick calories",
      category: selectedMealType || "Snack"
    };
  }

  const lower = clean.toLowerCase();

  let calories = 450;
  let protein = 20;
  let carbs = 45;
  let fat = 16;

  if (lower.includes("beer")) {
    calories =
      lower.includes("two") || lower.includes("2")
        ? 300
        : 150;

    protein = 0;
    carbs =
      lower.includes("two") || lower.includes("2")
        ? 26
        : 13;
    fat = 0;
  }

  else if (lower.includes("pizza")) {
    calories =
      lower.includes("two") || lower.includes("2")
        ? 600
        : 300;

    protein =
      lower.includes("two") || lower.includes("2")
        ? 24
        : 12;

    carbs =
      lower.includes("two") || lower.includes("2")
        ? 70
        : 35;

    fat =
      lower.includes("two") || lower.includes("2")
        ? 24
        : 12;
  }

  else if (lower.includes("taco")) {
    calories =
      lower.includes("two") || lower.includes("2")
        ? 520
        : 260;

    protein =
      lower.includes("two") || lower.includes("2")
        ? 28
        : 14;

    carbs =
      lower.includes("two") || lower.includes("2")
        ? 52
        : 26;

    fat =
      lower.includes("two") || lower.includes("2")
        ? 22
        : 11;
  }

  else if (
    lower.includes("burrito") ||
    lower.includes("chipotle")
  ) {
    calories = 760;
    protein = 38;
    carbs = 86;
    fat = 28;
  }

  else if (
    lower.includes("pasta") ||
    lower.includes("alfredo")
  ) {
    calories = 680;
    protein = 28;
    carbs = 72;
    fat = 30;
  }

  else if (lower.includes("salad")) {
    calories = lower.includes("chicken") ? 420 : 260;
    protein = lower.includes("chicken") ? 32 : 8;
    carbs = 22;
    fat = lower.includes("chicken") ? 18 : 14;
  }

  else if (
    lower.includes("egg") ||
    lower.includes("eggs")
  ) {
    calories = 320;
    protein = 22;
    carbs = 20;
    fat = 18;
  }

  else if (lower.includes("coffee")) {
    calories =
      lower.includes("cream") ||
      lower.includes("latte")
        ? 180
        : 5;

    protein = lower.includes("latte") ? 9 : 0;
    carbs = lower.includes("latte") ? 18 : 0;
    fat =
      lower.includes("cream") ||
      lower.includes("latte")
        ? 7
        : 0;
  }

  else if (
    lower.includes("shake") ||
    lower.includes("protein")
  ) {
    calories = 250;
    protein = 30;
    carbs = 14;
    fat = 5;
  }

  return {
    name:
      clean.length > 48
        ? clean.slice(0, 48) + "..."
        : clean,

    calories,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    serving_size: "Ari estimate",
    category: selectedMealType || "Meal"
  };
}

function analyzeWithAri() {
  const input = document.getElementById("ariNutritionInput");
  const result = document.getElementById("ariAiResult");

  const text = input?.value.trim();

  if (!text) return;

  setStatusText("ANALYZING", "Estimating");

  setTimeout(() => {

    estimatedMeal = estimateFromText(text);

    result.classList.add("show");

    result.innerHTML = `
      <h3>Nutrition Analysis</h3>

      <div class="ari-estimate-grid">

        <div class="ari-estimate-box">
          <span>Calories</span>
          <strong>${estimatedMeal.calories} kcal</strong>
        </div>

        <div class="ari-estimate-box">
          <span>Protein</span>
          <strong>${roundMacro(estimatedMeal.protein_g)} g</strong>
        </div>

        <div class="ari-estimate-box">
          <span>Carbs</span>
          <strong>${roundMacro(estimatedMeal.carbs_g)} g</strong>
        </div>

        <div class="ari-estimate-box">
          <span>Fat</span>
          <strong>${roundMacro(estimatedMeal.fat_g)} g</strong>
        </div>

      </div>

      <button
        class="ari-primary-action"
        type="button"
        onclick="logAriEstimate()">

        Log Meal

      </button>

      <button
        class="ari-secondary-action"
        type="button"
        onclick="editAriEstimate()">

        Edit Manually

      </button>
    `;

    setStatusText("READY", "Review");

  }, 900);
}

async function logAriEstimate() {

  if (!estimatedMeal) return;

  await addToIntake(estimatedMeal);

  document.getElementById("ariNutritionInput").value = "";

  document
    .getElementById("ariAiResult")
    .classList.remove("show");

  document
    .getElementById("ariAiResult")
    .innerHTML = "";

  estimatedMeal = null;

  setStatusText("ARI ONLINE", "Listening");
}

function editAriEstimate() {

  if (!estimatedMeal) return;

  selectMode("calories");

  document.getElementById("manualFoodName").value =
    estimatedMeal.name || "";

  document.getElementById("manualCalories").value =
    estimatedMeal.calories || "";

  document.getElementById("manualProtein").value =
    estimatedMeal.protein_g || "";

  document.getElementById("manualCarbs").value =
    estimatedMeal.carbs_g || "";

  document.getElementById("manualFat").value =
    estimatedMeal.fat_g || "";

  document.getElementById("manualServing").value =
    estimatedMeal.serving_size || "";

  document.getElementById("manualCategory").value =
    estimatedMeal.category || "Snack";
}
// =====================================================
// PART 3
// MODE SWITCHING + USDA SEARCH + MANUAL ENTRY
// =====================================================

function clearSections() {
  document.getElementById("mealOptions")?.classList.remove("show");
  document.getElementById("searchSection")?.classList.remove("show");
  document.getElementById("manualSection")?.classList.remove("show");

  document.querySelector(".entry-panel")?.classList.remove("show");

  const results = document.getElementById("results");
  const success = document.getElementById("successMessage");

  if (results) results.innerHTML = "";
  if (success) success.textContent = "";
}

function selectMode(mode) {
  currentMode = mode;

  if (mode === "drink") {
    selectedMealType = "Drink";
  }

  ["meal", "drink", "calorie"].forEach((name) => {
    const btn = document.getElementById(name + "Tab");
    if (btn) btn.classList.remove("active");
  });

  if (mode === "meal") {
    document.getElementById("mealTab")?.classList.add("active");
  }

  if (mode === "drink") {
    document.getElementById("drinkTab")?.classList.add("active");
  }

  if (mode === "calories") {
    document.getElementById("calorieTab")?.classList.add("active");
  }

  clearSections();

  document.querySelector(".entry-panel")?.classList.add("show");

  if (mode === "meal") {
    document.getElementById("mealOptions")?.classList.add("show");
  }

  if (mode === "drink") {
    document.getElementById("searchSection")?.classList.add("show");

    const label = document.getElementById("searchLabel");
    const input = document.getElementById("foodSearchInput");

    if (label) label.textContent = "Search drink";
    if (input) input.placeholder = "Example: orange juice";
  }

  if (mode === "calories") {
    document.getElementById("manualSection")?.classList.add("show");
  }
}

function selectMealType(type) {
  selectedMealType = type;

  document.querySelector(".entry-panel")?.classList.add("show");

  document.querySelectorAll(".ari-meal-type button").forEach((button) => {
    button.classList.toggle("active", button.textContent === type);
  });

  document.getElementById("searchSection")?.classList.add("show");
  document.getElementById("manualSection")?.classList.remove("show");

  const label = document.getElementById("searchLabel");
  const input = document.getElementById("foodSearchInput");
  const results = document.getElementById("results");
  const success = document.getElementById("successMessage");

  if (label) label.textContent = `Search food for ${type}`;
  if (input) input.placeholder = "Example: chicken burrito";
  if (results) results.innerHTML = "";
  if (success) success.textContent = "";
}

function scoreFoodResult(food, query) {
  const desc = (food.description || "").toLowerCase();
  const brand = food.brandName || "";
  const dataType = (food.dataType || "").toLowerCase();
  const q = query.toLowerCase();

  let score = 0;

  if (!brand) score += 40;
  if (dataType.includes("foundation")) score += 40;
  if (dataType.includes("sr legacy")) score += 35;

  if (desc === q) score += 100;
  if (desc === `${q}, raw`) score += 95;
  if (desc.includes(`${q}, raw`)) score += 80;
  if (desc.startsWith(q)) score += 50;

  if (desc.includes("raw")) score += 20;
  if (desc.includes("baked")) score += 5;

  if (brand) score -= 30;
  if (desc.includes("peanut butter")) score -= 40;
  if (desc.includes("flavored")) score -= 15;
  if (desc.includes("candy")) score -= 20;

  return score;
}

async function searchFood() {
  const input = document.getElementById("foodSearchInput");
  const results = document.getElementById("results");

  if (!input || !results) return;

  const query = input.value.trim();

  if (!currentMode) {
    results.innerHTML = "<p>Please choose Meal, Drink, or Calories first.</p>";
    return;
  }

  if (currentMode === "meal" && !selectedMealType) {
    results.innerHTML = "<p>Please choose Breakfast, Lunch, Dinner, or Snack first.</p>";
    return;
  }

  if (!query) {
    results.innerHTML = "<p>Please type a food or drink to search.</p>";
    return;
  }

  results.innerHTML = "<p>Searching...</p>";

  try {
    const url =
      `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=25&api_key=DEMO_KEY`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.foods || data.foods.length === 0) {
      results.innerHTML = "<p>No results found.</p>";
      return;
    }

    const sortedFoods = data.foods.sort((a, b) => {
      return scoreFoodResult(b, query) - scoreFoodResult(a, query);
    });

    results.innerHTML = "";

    sortedFoods.slice(0, 10).forEach((food) => {
      const nutrients = food.foodNutrients || [];

      const getNutrient = (names) => {
        const found = nutrients.find((nutrient) =>
          names.some((name) =>
            nutrient.nutrientName?.toLowerCase().includes(name.toLowerCase())
          )
        );

        return found?.value ?? 0;
      };

      const baseCalories = Math.round(Number(getNutrient(["Energy"]) || 0));
      const baseProtein = Number(getNutrient(["Protein"]) || 0);
      const baseCarbs = Number(getNutrient(["Carbohydrate"]) || 0);
      const baseFat = Number(getNutrient(["Total lipid", "Total Fat"]) || 0);

      const servingSize =
        food.servingSize && food.servingSizeUnit
          ? `${food.servingSize} ${food.servingSizeUnit}`
          : food.householdServingFullText || "100 g";

      let multiplier = 1;

      const card = document.createElement("div");
      card.className = "food-result";

      function renderCardValues() {
        const adjustedCalories = Math.round(baseCalories * multiplier);
        const adjustedProtein = roundMacro(baseProtein * multiplier);
        const adjustedCarbs = roundMacro(baseCarbs * multiplier);
        const adjustedFat = roundMacro(baseFat * multiplier);

        card.innerHTML = `
          <h3>${food.description}</h3>
          <p>${food.brandName ? food.brandName : "USDA FoodData Central"}</p>
          <p>Serving: ${servingSize}</p>

          <div class="multiplier-row">
            <button type="button" class="minus-btn">−</button>
            <span class="multiplier-value">${multiplier.toFixed(1)}x serving</span>
            <button type="button" class="plus-btn">+</button>
          </div>

          <p><strong>${adjustedCalories} kcal</strong></p>

          <div class="macro-row">
            <div class="macro-box">${adjustedProtein}g<br>Protein</div>
            <div class="macro-box">${adjustedCarbs}g<br>Carbs</div>
            <div class="macro-box">${adjustedFat}g<br>Fat</div>
          </div>

          <button class="ari-primary-action add-food-btn" type="button">
            Add to ${selectedMealType || "Log"}
          </button>
        `;

        card.querySelector(".minus-btn")?.addEventListener("click", () => {
          multiplier = Math.max(0.5, multiplier - 0.5);
          renderCardValues();
        });

        card.querySelector(".plus-btn")?.addEventListener("click", () => {
          multiplier += 0.5;
          renderCardValues();
        });

        card.querySelector(".add-food-btn")?.addEventListener("click", async (event) => {
          event.target.disabled = true;
          event.target.textContent = "Added";

          await addToIntake({
            name: food.description,
            calories: adjustedCalories,
            category: selectedMealType || "Meal",
            protein_g: adjustedProtein,
            carbs_g: adjustedCarbs,
            fat_g: adjustedFat,
            serving_size: servingSize,
            multiplier
          });
        });
      }

      renderCardValues();
      results.appendChild(card);
    });
  } catch (error) {
    results.innerHTML = `<p>Search failed: ${error.message}</p>`;
  }
}

async function saveManualCalories() {
  const name = document.getElementById("manualFoodName")?.value.trim();
  const calories = Number(document.getElementById("manualCalories")?.value);
  const protein = Number(document.getElementById("manualProtein")?.value || 0);
  const carbs = Number(document.getElementById("manualCarbs")?.value || 0);
  const fat = Number(document.getElementById("manualFat")?.value || 0);
  const serving = document.getElementById("manualServing")?.value.trim();
  const category = document.getElementById("manualCategory")?.value || "Snack";

  const success = document.getElementById("successMessage");

  if (!name) {
    if (success) success.textContent = "Please enter a food or item name.";
    return;
  }

  if (!calories || calories <= 0) {
    if (success) success.textContent = "Please enter a valid calorie amount.";
    return;
  }

  await addToIntake({
    name,
    calories: Math.round(calories),
    category,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    serving_size: serving || "Manual entry",
    multiplier: 1
  });

  [
    "manualFoodName",
    "manualCalories",
    "manualProtein",
    "manualCarbs",
    "manualFat",
    "manualServing"
  ].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = "";
  });
}

async function addToIntake(meal) {
  const user = await getNutritionUser();
  const windowInfo = await getNutritionWindow();
  const createdAt = new Date().toISOString();

  const mealToSave = {
    name: meal.name,
    calories: Number(meal.calories || 0),
    category: meal.category || "Meal",
    nutrition_date: windowInfo.nutritionDate,
    protein_g: Number(meal.protein_g || 0),
    carbs_g: Number(meal.carbs_g || 0),
    fat_g: Number(meal.fat_g || 0),
    serving_size: meal.serving_size || null,
    multiplier: Number(meal.multiplier || 1),
    is_favorite: Boolean(meal.is_favorite || false),
    created_at: createdAt
  };

  const success = document.getElementById("successMessage");

  if (user && window.calbuddySupabase) {
    const { error } = await window.calbuddySupabase
      .from("meals")
      .insert({
        user_id: user.id,
        ...mealToSave
      });

    if (error) {
      saveMealLocally(mealToSave);

      if (success) {
        success.textContent =
          "Saved on this device, but cloud save failed: " + error.message;
      }
    } else if (success) {
      success.textContent =
        `Added to ${mealToSave.category}: ${mealToSave.name} — ${mealToSave.calories} kcal`;
    }
  } else {
    saveMealLocally(mealToSave);

    if (success) {
      success.textContent =
        `Added to ${mealToSave.category}: ${mealToSave.name} — ${mealToSave.calories} kcal`;
    }
  }

  const searchInput = document.getElementById("foodSearchInput");
  const results = document.getElementById("results");

  if (searchInput) searchInput.value = "";
  if (results) results.innerHTML = "";

  await renderTodayIntake();
}

function saveMealLocally(meal) {
  const meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]");

  meals.push({
    id: Date.now(),
    date: meal.nutrition_date,
    ...meal,
    source: "local"
  });

  localStorage.setItem("calbuddyMeals", JSON.stringify(meals));
}
// =====================================================
// PART 4
// INTAKE RENDERING + HISTORY + FAVORITES + INIT
// =====================================================

async function getMealsInWindow(windowInfo) {
  const user = await getNutritionUser();

  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", windowInfo.start.toISOString())
      .lt("created_at", windowInfo.end.toISOString())
      .order("created_at", { ascending: true });

    if (!error && data) {
      return data.map((meal) => ({
        ...meal,
        source: "supabase"
      }));
    }
  }

  const meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]");

  return meals
    .filter((meal) => {
      const created = new Date(
        meal.created_at ||
        meal.createdAt ||
        meal.date ||
        meal.nutrition_date
      );

      return created >= windowInfo.start && created < windowInfo.end;
    })
    .map((meal) => ({
      ...meal,
      source: "local"
    }));
}

async function renderTodayIntake() {
  const itemsDiv = document.getElementById("todayIntakeItems");
  const totalText = document.getElementById("totalConsumedText");
  const proteinText = document.getElementById("totalProteinText");
  const carbsText = document.getElementById("totalCarbsText");
  const fatText = document.getElementById("totalFatText");

  if (!itemsDiv || !totalText || !proteinText || !carbsText || !fatText) return;

  const windowInfo = await getNutritionWindow();

  updateWindowNote(windowInfo);

  const meals = await getMealsInWindow(windowInfo);

  if (!meals.length) {
    itemsDiv.innerHTML =
      "<p class='window-note'>No meals logged in this reset window.</p>";

    totalText.textContent = "0";
    proteinText.textContent = "0";
    carbsText.textContent = "0";
    fatText.textContent = "0";

    localStorage.setItem("calbuddyCaloriesConsumed", 0);

    return;
  }

  itemsDiv.innerHTML = "";

  meals.forEach((meal) => {
    const item = document.createElement("div");
    item.className = "intake-item";

    item.innerHTML = `
      <strong>${meal.category}: ${meal.name}</strong>

      <p>${Math.round(meal.calories)} kcal</p>

      <p>
        ${roundMacro(meal.protein_g)}g P •
        ${roundMacro(meal.carbs_g)}g C •
        ${roundMacro(meal.fat_g)}g F
      </p>

      <p>
        Serving: ${meal.serving_size || "-"}
        ${meal.multiplier ? `• ${meal.multiplier}x` : ""}
      </p>

      <div class="intake-actions">
        <button class="favorite-btn" type="button">Favorite</button>
        <button class="repeat-btn" type="button">Repeat</button>
        <button class="delete-intake-btn" type="button">Delete</button>
      </div>
    `;

    item.querySelector(".delete-intake-btn")?.addEventListener("click", () => {
      deleteIntakeItem(meal.id, meal.source);
    });

    item.querySelector(".repeat-btn")?.addEventListener("click", () => {
      repeatMeal(meal);
    });

    item.querySelector(".favorite-btn")?.addEventListener("click", () => {
      favoriteMeal(meal.id, meal.source);
    });

    itemsDiv.appendChild(item);
  });

  const total = meals.reduce(
    (sum, item) => sum + Number(item.calories || 0),
    0
  );

  const protein = meals.reduce(
    (sum, item) => sum + Number(item.protein_g || 0),
    0
  );

  const carbs = meals.reduce(
    (sum, item) => sum + Number(item.carbs_g || 0),
    0
  );

  const fat = meals.reduce(
    (sum, item) => sum + Number(item.fat_g || 0),
    0
  );

  totalText.textContent = Math.round(total).toLocaleString();
  proteinText.textContent = roundMacro(protein);
  carbsText.textContent = roundMacro(carbs);
  fatText.textContent = roundMacro(fat);

  localStorage.setItem("calbuddyCaloriesConsumed", Math.round(total));
}

async function repeatMeal(meal) {
  await addToIntake({
    name: meal.name,
    calories: meal.calories,
    category: meal.category,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fat_g: meal.fat_g,
    serving_size: meal.serving_size,
    multiplier: meal.multiplier || 1,
    is_favorite: false
  });
}

async function repeatPreviousWindow() {
  const previousWindow = await getNutritionWindow(-1);
  const previousMeals = await getMealsInWindow(previousWindow);
  const success = document.getElementById("successMessage");

  if (!previousMeals.length) {
    if (success) {
      success.textContent =
        "No meals found from the previous reset window.";
    }

    return;
  }

  for (const meal of previousMeals) {
    await repeatMeal(meal);
  }

  if (success) {
    success.textContent =
      `Repeated ${previousMeals.length} meals from the previous reset window.`;
  }
}

async function favoriteMeal(id, source) {
  const success = document.getElementById("successMessage");

  if (source === "supabase" && window.calbuddySupabase) {
    const { error } = await window.calbuddySupabase
      .from("meals")
      .update({ is_favorite: true })
      .eq("id", id);

    if (error) {
      if (success) {
        success.textContent =
          "Could not favorite meal: " + error.message;
      }

      return;
    }
  } else {
    const meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]");

    const updatedMeals = meals.map((meal) =>
      String(meal.id) === String(id)
        ? { ...meal, is_favorite: true }
        : meal
    );

    localStorage.setItem("calbuddyMeals", JSON.stringify(updatedMeals));
  }

  if (success) {
    success.textContent = "Added to favorites.";
  }

  await renderTodayIntake();
}

async function deleteIntakeItem(id, source) {
  const success = document.getElementById("successMessage");

  if (source === "supabase" && window.calbuddySupabase) {
    const { error } = await window.calbuddySupabase
      .from("meals")
      .delete()
      .eq("id", id);

    if (error) {
      if (success) {
        success.textContent =
          "Could not delete cloud meal: " + error.message;
      }

      return;
    }
  } else {
    const meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]");

    const updatedMeals = meals.filter((meal) =>
      String(meal.id) !== String(id)
    );

    localStorage.setItem("calbuddyMeals", JSON.stringify(updatedMeals));
  }

  if (success) {
    success.textContent = "Item removed. Calories updated.";
  }

  await renderTodayIntake();
}

async function renderMealHistory() {
  const container = document.getElementById("historyItems");
  const user = await getNutritionUser();

  if (!container) return;

  const today = new Date();

  const start = new Date();
  start.setDate(today.getDate() - 14);

  let meals = [];

  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", start.toISOString())
      .order("created_at", { ascending: false });

    if (!error && data) {
      meals = data;
    }
  } else {
    meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]")
      .filter((meal) => {
        const created = new Date(
          meal.created_at ||
          meal.date ||
          meal.nutrition_date
        );

        return created >= start;
      });
  }

  container.innerHTML = meals.length
    ? ""
    : "<p class='window-note'>No meal history yet.</p>";

  meals.forEach((meal) => {
    const card = document.createElement("div");
    card.className = "history-card";

    const displayDate = meal.created_at
      ? new Date(meal.created_at).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        })
      : meal.nutrition_date || meal.date;

    card.innerHTML = `
      <strong>${displayDate} — ${meal.category}</strong>

      <p>${meal.name}</p>

      <p>
        ${meal.calories} kcal •
        ${roundMacro(meal.protein_g)}P /
        ${roundMacro(meal.carbs_g)}C /
        ${roundMacro(meal.fat_g)}F
      </p>

      <button class="ari-secondary-action" type="button">
        Repeat Now
      </button>
    `;

    card.querySelector("button")?.addEventListener("click", () => {
      repeatMeal(meal);
    });

    container.appendChild(card);
  });
}

async function renderFavorites() {
  const container = document.getElementById("favoriteItems");
  const user = await getNutritionUser();

  if (!container) return;

  let meals = [];

  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_favorite", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      meals = data;
    }
  } else {
    meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]")
      .filter((meal) => meal.is_favorite);
  }

  container.innerHTML = meals.length
    ? ""
    : "<p class='window-note'>No favorite meals yet.</p>";

  meals.forEach((meal) => {
    const card = document.createElement("div");
    card.className = "favorite-card";

    card.innerHTML = `
      <strong>${meal.name}</strong>

      <p>
        ${meal.calories} kcal •
        ${roundMacro(meal.protein_g)}P /
        ${roundMacro(meal.carbs_g)}C /
        ${roundMacro(meal.fat_g)}F
      </p>

      <button class="ari-secondary-action" type="button">
        Add Again Now
      </button>
    `;

    card.querySelector("button")?.addEventListener("click", () => {
      repeatMeal(meal);
    });

    container.appendChild(card);
  });
}

async function toggleHistory() {
  const section = document.getElementById("historySection");

  if (!section) return;

  section.classList.toggle("show");

  if (section.classList.contains("show")) {
    await renderMealHistory();
  }
}

async function toggleFavorites() {
  const section = document.getElementById("favoritesSection");

  if (!section) return;

  section.classList.toggle("show");

  if (section.classList.contains("show")) {
    await renderFavorites();
  }
}

async function handlePendingCalBuddyMeal() {
  const pending = localStorage.getItem("calbuddyPendingMealToLog");

  if (!pending) return;

  try {
    const meal = JSON.parse(pending);

    if (meal && meal.name && meal.calories) {
      await addToIntake({
        name: meal.name,
        calories: meal.calories,
        category: meal.category || "Meal",
        protein_g: meal.protein_g || 0,
        carbs_g: meal.carbs_g || 0,
        fat_g: meal.fat_g || 0,
        serving_size: meal.serving_size || "Added by CalBuddy",
        multiplier: meal.multiplier || 1
      });

      const success = document.getElementById("successMessage");

      if (success) {
        success.textContent =
          `CalBuddy added: ${meal.name} — ${meal.calories} kcal`;
      }

      localStorage.removeItem("calbuddyPendingMealToLog");
    }
  } catch {
    localStorage.removeItem("calbuddyPendingMealToLog");
  }
}

function setupNutritionToggle() {
  const intake = document.querySelector(".intake-list");

  if (!intake) return;

  intake.addEventListener("click", (event) => {
    if (event.target.closest("button")) return;

    intake.classList.toggle("open");
  });
}

// -----------------------------------------------------
// Initialize
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  rotateNutritionPrompt();
  setupNutritionToggle();

  setInterval(rotateNutritionPrompt, 5500);

  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode");

  if (mode === "meal") {
    selectMode("meal");
  } else if (mode === "drink") {
    selectMode("drink");
  } else if (mode === "repeat") {
    await toggleHistory();
  } else if (mode === "favorite") {
    await toggleFavorites();
  }

  await handlePendingCalBuddyMeal();
  await renderTodayIntake();
});

// =====================================================
// ARI REBIRTH
// Nutrition AI Meal Composer Patch
// Version: 3.1.0
//
// INSTALLATION:
// Append this entire block to the BOTTOM of js/nutrition.js.
//
// Purpose:
// - Replace the local keyword estimator with CalBuddy.askAri()
// - Ask Ari for a structured meal calorie/macro estimate
// - Require user confirmation before logging
// - Support both the newer estimate-card HTML and the older
//   ariAiResult-only layout
// =====================================================

const NUTRITION_ARI_COMPOSER_VERSION = "3.1.0";

let ariNutritionRequestBusy = false;
let ariNutritionAbortController = null;
let ariNutritionEstimateHistory = [];

// -----------------------------------------------------
// Composer request
// -----------------------------------------------------

window.analyzeWithAri = async function analyzeWithAri(event) {
  event?.preventDefault?.();

  if (ariNutritionRequestBusy) return;

  const input = document.getElementById("ariNutritionInput");
  const description = String(input?.value || "").trim();

  if (!description) {
    setNutritionAriMessage(
      "Describe the meal, drink, ingredients, and portions first.",
      "error"
    );
    input?.focus();
    return;
  }

  /*
   * Preserve the existing +350 / 350 calories shortcut.
   * Exact manual calorie entries do not need an AI request.
   */
  const directCalories = parseDirectCalorieEntry(description);

  if (directCalories !== null) {
    estimatedMeal = {
      name: "Manual calorie entry",
      calories: directCalories,
      protein_g: 0,
      carbs_g: 0,
      fat_g: 0,
      fiber_g: 0,
      serving_size: "Direct calorie entry",
      category: selectedMealType || "Snack",
      confidence: "exact",
      assumptions: [],
      original_description: description,
      source: "direct_calorie_entry"
    };

    renderAriMealEstimate(estimatedMeal);
    setStatusText("READY", "Review");
    return;
  }

  if (!window.CalBuddy?.askAri) {
    setStatusText("ARI OFFLINE", "Unavailable");
    setNutritionAriMessage(
      "The Ari bridge is not loaded on this page. Load the same CalBuddy/Ari bridge scripts used by home.html before js/nutrition.js.",
      "error"
    );
    return;
  }

  ariNutritionRequestBusy = true;
  ariNutritionAbortController = new AbortController();

  setNutritionComposerBusy(true);
  setStatusText("ARI ANALYZING", "Estimating");
  hideAriMealEstimate();
  setNutritionAriMessage("Ari is estimating the meal...", "thinking");

  const requestMessage = buildNutritionEstimatePrompt(description);

  ariNutritionEstimateHistory.push({
    role: "user",
    content: description
  });

  ariNutritionEstimateHistory =
    ariNutritionEstimateHistory.slice(-6);

  try {
    const response = await window.CalBuddy.askAri({
      message: requestMessage,
      history: ariNutritionEstimateHistory,
      appContext: {
        domain: "nutrition",
        page: "nutrition_console",
        operation: "estimate_meal_nutrition",
        requestedResult: "structured_meal_estimate",
        selectedMealType: selectedMealType || null,
        doNotLog: true
      },
      debugTiming: true,
      signal: ariNutritionAbortController.signal
    });

    const parsedEstimate =
      extractMealEstimateFromAriResponse(
        response,
        description
      );

    if (!parsedEstimate) {
      const reply = String(
        response?.reply ||
        "Ari answered, but the response did not contain a usable calorie estimate."
      ).trim();

      setNutritionAriMessage(reply, "reply");
      setStatusText("ARI ONLINE", "Listening");
      return;
    }

    estimatedMeal = parsedEstimate;

    renderAriMealEstimate(estimatedMeal);

    ariNutritionEstimateHistory.push({
      role: "assistant",
      content: JSON.stringify({
        name: estimatedMeal.name,
        calories: estimatedMeal.calories,
        protein_g: estimatedMeal.protein_g,
        carbs_g: estimatedMeal.carbs_g,
        fat_g: estimatedMeal.fat_g,
        fiber_g: estimatedMeal.fiber_g
      })
    });

    ariNutritionEstimateHistory =
      ariNutritionEstimateHistory.slice(-6);

    setStatusText("READY", "Review");
  } catch (error) {
    if (error?.name === "AbortError") {
      setNutritionAriMessage("Estimate stopped.", "reply");
    } else {
      console.error("Ari nutrition estimate failed:", error);

      setNutritionAriMessage(
        error?.message ||
          "Ari could not estimate that meal. Try adding portions or ingredients.",
        "error"
      );
    }

    setStatusText("ARI ONLINE", "Listening");
  } finally {
    ariNutritionRequestBusy = false;
    ariNutritionAbortController = null;
    setNutritionComposerBusy(false);
  }
};

// -----------------------------------------------------
// Prompt contract
// -----------------------------------------------------

function buildNutritionEstimatePrompt(description) {
  const category = selectedMealType || "Meal";

  return [
    "You are Ari operating inside the CalBuddy Nutrition Console.",
    "Estimate the total nutrition for the user's described meal.",
    "Do not log, save, or create a pending action.",
    "Use reasonable standard portions only when the user omitted details.",
    "When an estimate is uncertain, state the assumptions.",
    "",
    `Selected category: ${category}`,
    `Meal description: ${description}`,
    "",
    "Return ONLY valid JSON using this exact shape:",
    "{",
    '  "mealName": "short meal name",',
    '  "estimatedCalories": 0,',
    '  "macros": {',
    '    "proteinGrams": 0,',
    '    "carbohydrateGrams": 0,',
    '    "fatGrams": 0,',
    '    "fiberGrams": 0',
    "  },",
    '  "servingSize": "brief serving summary",',
    '  "category": "Breakfast, Lunch, Dinner, Snack, Drink, or Meal",',
    '  "confidence": "high, medium, or low",',
    '  "assumptions": ["assumption one"]',
    "}",
    "",
    "Use numbers rather than strings for calories and macros."
  ].join("\n");
}

// -----------------------------------------------------
// Response extraction
// -----------------------------------------------------

function extractMealEstimateFromAriResponse(
  response,
  originalDescription
) {
  const candidates = [
    response?.mealEstimate,
    response?.nutritionEstimate,
    response?.structuredResult,
    response?.result,
    response?.data,
    response?.pendingAction,
    parseJsonFromText(response?.reply)
  ];

  let bestCandidate = null;
  let bestScore = -1;

  candidates.forEach((candidate) => {
    const found = findBestMealCandidate(candidate);

    if (found && found.score > bestScore) {
      bestCandidate = found.value;
      bestScore = found.score;
    }
  });

  let normalized = normalizeMealEstimate(
    bestCandidate,
    originalDescription
  );

  /*
   * Ari may return a readable answer instead of JSON.
   * Parse common calorie/macro labels as a fallback.
   */
  if (!normalized) {
    normalized = parseMealEstimateFromReply(
      response?.reply,
      originalDescription
    );
  }

  return normalized;
}

function findBestMealCandidate(value, depth = 0) {
  if (
    value === null ||
    value === undefined ||
    depth > 6
  ) {
    return null;
  }

  if (typeof value === "string") {
    const parsed = parseJsonFromText(value);

    return parsed
      ? findBestMealCandidate(parsed, depth + 1)
      : null;
  }

  if (Array.isArray(value)) {
    let best = null;

    value.forEach((item) => {
      const found = findBestMealCandidate(
        item,
        depth + 1
      );

      if (!best || (found && found.score > best.score)) {
        best = found;
      }
    });

    return best;
  }

  if (typeof value !== "object") {
    return null;
  }

  let score = scoreMealCandidate(value);
  let best = score > 0
    ? { value, score }
    : null;

  Object.values(value).forEach((nestedValue) => {
    const found = findBestMealCandidate(
      nestedValue,
      depth + 1
    );

    if (
      found &&
      (!best || found.score > best.score)
    ) {
      best = found;
    }
  });

  return best;
}

function scoreMealCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return 0;
  }

  const keys = Object.keys(candidate).map((key) =>
    key.toLowerCase()
  );

  let score = 0;

  if (
    keys.some((key) =>
      [
        "estimatedcalories",
        "totalcalories",
        "calories",
        "kcal"
      ].includes(key)
    )
  ) {
    score += 10;
  }

  if (
    keys.some((key) =>
      [
        "mealname",
        "name",
        "title",
        "foodname"
      ].includes(key)
    )
  ) {
    score += 3;
  }

  if (
    keys.some((key) =>
      [
        "macros",
        "nutrition",
        "nutrients"
      ].includes(key)
    )
  ) {
    score += 5;
  }

  if (
    keys.some((key) =>
      key.includes("protein")
    )
  ) {
    score += 2;
  }

  if (
    keys.some((key) =>
      key.includes("carb")
    )
  ) {
    score += 2;
  }

  if (
    keys.some((key) =>
      key.includes("fat")
    )
  ) {
    score += 2;
  }

  return score;
}

function normalizeMealEstimate(
  candidate,
  originalDescription
) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const macros =
    candidate.macros ||
    candidate.nutrition ||
    candidate.nutrients ||
    {};

  const calories = readNumericValue(
    candidate,
    [
      "estimatedCalories",
      "totalCalories",
      "calories",
      "kcal",
      "energy"
    ]
  );

  if (!Number.isFinite(calories) || calories <= 0) {
    return null;
  }

  const protein = firstFiniteNumber([
    readNumericValue(candidate, [
      "proteinGrams",
      "protein_g",
      "protein"
    ]),
    readNumericValue(macros, [
      "proteinGrams",
      "protein_g",
      "protein"
    ])
  ]);

  const carbs = firstFiniteNumber([
    readNumericValue(candidate, [
      "carbohydrateGrams",
      "carbohydratesGrams",
      "carbsGrams",
      "carbs_g",
      "carbs",
      "carbohydrates"
    ]),
    readNumericValue(macros, [
      "carbohydrateGrams",
      "carbohydratesGrams",
      "carbsGrams",
      "carbs_g",
      "carbs",
      "carbohydrates"
    ])
  ]);

  const fat = firstFiniteNumber([
    readNumericValue(candidate, [
      "fatGrams",
      "fat_g",
      "fat"
    ]),
    readNumericValue(macros, [
      "fatGrams",
      "fat_g",
      "fat"
    ])
  ]);

  const fiber = firstFiniteNumber([
    readNumericValue(candidate, [
      "fiberGrams",
      "fibreGrams",
      "fiber_g",
      "fiber",
      "fibre"
    ]),
    readNumericValue(macros, [
      "fiberGrams",
      "fibreGrams",
      "fiber_g",
      "fiber",
      "fibre"
    ])
  ]);

  const assumptions = normalizeStringArray(
    candidate.assumptions ||
    candidate.notes ||
    candidate.estimatedAssumptions
  );

  const name =
    readStringValue(candidate, [
      "mealName",
      "name",
      "title",
      "foodName"
    ]) ||
    createMealName(originalDescription);

  const category =
    normalizeMealCategory(
      readStringValue(candidate, ["category"]) ||
      selectedMealType ||
      "Meal"
    );

  return {
    name,
    calories: Math.round(calories),
    protein_g: roundMacro(protein),
    carbs_g: roundMacro(carbs),
    fat_g: roundMacro(fat),
    fiber_g: roundMacro(fiber),
    serving_size:
      readStringValue(candidate, [
        "servingSize",
        "serving_size",
        "portion",
        "portionSize"
      ]) ||
      "Ari estimated meal",
    category,
    confidence:
      normalizeConfidence(
        readStringValue(candidate, ["confidence"])
      ),
    assumptions,
    original_description: originalDescription,
    source: "ari_meal_estimate"
  };
}

function parseMealEstimateFromReply(
  reply,
  originalDescription
) {
  const text = String(reply || "").trim();

  if (!text) return null;

  const calories = matchNutritionNumber(text, [
    /(?:total\s+)?calories?\s*(?:are|is|:|=|-)?\s*~?\s*(\d{2,5}(?:\.\d+)?)/i,
    /(\d{2,5}(?:\.\d+)?)\s*(?:kcal|calories?)\b/i
  ]);

  if (!Number.isFinite(calories) || calories <= 0) {
    return null;
  }

  return {
    name: createMealName(originalDescription),
    calories: Math.round(calories),
    protein_g: roundMacro(
      matchNutritionNumber(text, [
        /protein\s*(?:is|:|=|-)?\s*~?\s*(\d+(?:\.\d+)?)\s*g/i,
        /(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?protein/i
      ])
    ),
    carbs_g: roundMacro(
      matchNutritionNumber(text, [
        /(?:carbs?|carbohydrates?)\s*(?:are|is|:|=|-)?\s*~?\s*(\d+(?:\.\d+)?)\s*g/i,
        /(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?(?:carbs?|carbohydrates?)/i
      ])
    ),
    fat_g: roundMacro(
      matchNutritionNumber(text, [
        /fat\s*(?:is|:|=|-)?\s*~?\s*(\d+(?:\.\d+)?)\s*g/i,
        /(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?fat/i
      ])
    ),
    fiber_g: roundMacro(
      matchNutritionNumber(text, [
        /fib(?:er|re)\s*(?:is|:|=|-)?\s*~?\s*(\d+(?:\.\d+)?)\s*g/i,
        /(\d+(?:\.\d+)?)\s*g\s*(?:of\s*)?fib(?:er|re)/i
      ])
    ),
    serving_size: "Ari estimated meal",
    category: selectedMealType || "Meal",
    confidence: "medium",
    assumptions: [],
    original_description: originalDescription,
    source: "ari_reply_estimate"
  };
}

function parseJsonFromText(value) {
  const text = String(value || "").trim();

  if (!text) return null;

  const withoutFence = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const attempts = [withoutFence];

  const firstBrace = withoutFence.indexOf("{");
  const lastBrace = withoutFence.lastIndexOf("}");

  if (
    firstBrace >= 0 &&
    lastBrace > firstBrace
  ) {
    attempts.push(
      withoutFence.slice(firstBrace, lastBrace + 1)
    );
  }

  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch {
      // Continue to the next candidate.
    }
  }

  return null;
}

// -----------------------------------------------------
// Estimate rendering
// -----------------------------------------------------

function renderAriMealEstimate(meal) {
  const card =
    document.getElementById("ariMealEstimateCard");

  if (card) {
    setTextContent(
      "ariMealEstimateTitle",
      meal.name || "Estimated Meal"
    );

    setTextContent(
      "ariEstimatedCalories",
      Math.round(meal.calories || 0)
        .toLocaleString()
    );

    setTextContent(
      "ariEstimatedProtein",
      roundMacro(meal.protein_g)
    );

    setTextContent(
      "ariEstimatedCarbs",
      roundMacro(meal.carbs_g)
    );

    setTextContent(
      "ariEstimatedFat",
      roundMacro(meal.fat_g)
    );

    setTextContent(
      "ariEstimatedFiber",
      roundMacro(meal.fiber_g)
    );

    setTextContent(
      "ariMealEstimateConfidence",
      formatConfidenceLabel(meal.confidence)
    );

    renderEstimateAssumptions(meal.assumptions);

    card.hidden = false;
    card.classList.add("show");

    setNutritionAriMessage(
      "Review Ari's estimate before logging it.",
      "reply"
    );

    requestAnimationFrame(() => {
      card.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    });

    return;
  }

  /*
   * Backward-compatible result rendering for the
   * original Nutrition HTML.
   */
  const result = document.getElementById("ariAiResult");

  if (!result) return;

  result.classList.add("show");
  result.innerHTML = "";

  const title = document.createElement("h3");
  title.textContent = meal.name || "Estimated Meal";

  const grid = document.createElement("div");
  grid.className = "ari-estimate-grid";

  [
    ["Calories", `${Math.round(meal.calories)} kcal`],
    ["Protein", `${roundMacro(meal.protein_g)} g`],
    ["Carbs", `${roundMacro(meal.carbs_g)} g`],
    ["Fat", `${roundMacro(meal.fat_g)} g`],
    ["Fiber", `${roundMacro(meal.fiber_g)} g`]
  ].forEach(([label, value]) => {
    const box = document.createElement("div");
    box.className = "ari-estimate-box";

    const labelEl = document.createElement("span");
    labelEl.textContent = label;

    const valueEl = document.createElement("strong");
    valueEl.textContent = value;

    box.append(labelEl, valueEl);
    grid.appendChild(box);
  });

  const logButton = document.createElement("button");
  logButton.className = "ari-primary-action";
  logButton.type = "button";
  logButton.textContent = "Log Meal";
  logButton.addEventListener(
    "click",
    window.logAriEstimatedMeal
  );

  const editButton = document.createElement("button");
  editButton.className = "ari-secondary-action";
  editButton.type = "button";
  editButton.textContent = "Edit Details";
  editButton.addEventListener(
    "click",
    window.editAriEstimatedMeal
  );

  result.append(
    title,
    grid,
    logButton,
    editButton
  );
}

function renderEstimateAssumptions(assumptions = []) {
  const section = document.getElementById(
    "ariMealEstimateAssumptions"
  );

  const list = document.getElementById(
    "ariMealEstimateAssumptionsList"
  );

  if (!section || !list) return;

  list.innerHTML = "";

  if (!assumptions.length) {
    section.hidden = true;
    return;
  }

  assumptions.forEach((assumption) => {
    const item = document.createElement("li");
    item.textContent = assumption;
    list.appendChild(item);
  });

  section.hidden = false;
}

function hideAriMealEstimate() {
  const card =
    document.getElementById("ariMealEstimateCard");

  if (card) {
    card.hidden = true;
    card.classList.remove("show");
  }

  const result = document.getElementById("ariAiResult");

  if (result) {
    result.classList.remove(
      "show",
      "error",
      "thinking",
      "reply"
    );
    result.textContent = "";
  }
}

// -----------------------------------------------------
// Confirm / edit
// -----------------------------------------------------

window.logAriEstimatedMeal =
  async function logAriEstimatedMeal() {
    if (!estimatedMeal) return;

    const button = document.getElementById(
      "ariLogEstimatedMealButton"
    );

    if (button) {
      button.disabled = true;
      button.textContent = "Logging...";
    }

    try {
      await addToIntake({
        name: estimatedMeal.name,
        calories: estimatedMeal.calories,
        category:
          estimatedMeal.category ||
          selectedMealType ||
          "Meal",
        protein_g: estimatedMeal.protein_g,
        carbs_g: estimatedMeal.carbs_g,
        fat_g: estimatedMeal.fat_g,
        serving_size:
          estimatedMeal.serving_size ||
          "Ari estimated meal",
        multiplier: 1
      });

      const input =
        document.getElementById("ariNutritionInput");

      if (input) input.value = "";

      estimatedMeal = null;
      hideAriMealEstimate();
      setNutritionAriMessage(
        "Meal logged. Today's totals were updated.",
        "success"
      );
      setStatusText("ARI ONLINE", "Listening");
    } catch (error) {
      console.error("Could not log Ari estimate:", error);

      setNutritionAriMessage(
        error?.message ||
          "The estimate could not be logged.",
        "error"
      );
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Log Meal";
      }
    }
  };

window.editAriEstimatedMeal =
  function editAriEstimatedMeal() {
    if (!estimatedMeal) return;

    selectMode("calories");

    setInputValueSafe(
      "manualFoodName",
      estimatedMeal.name || ""
    );

    setInputValueSafe(
      "manualCalories",
      estimatedMeal.calories || ""
    );

    setInputValueSafe(
      "manualProtein",
      estimatedMeal.protein_g || ""
    );

    setInputValueSafe(
      "manualCarbs",
      estimatedMeal.carbs_g || ""
    );

    setInputValueSafe(
      "manualFat",
      estimatedMeal.fat_g || ""
    );

    setInputValueSafe(
      "manualServing",
      estimatedMeal.serving_size ||
        "Ari estimated meal"
    );

    setInputValueSafe(
      "manualCategory",
      normalizeMealCategory(
        estimatedMeal.category ||
        selectedMealType ||
        "Snack"
      )
    );

    document
      .querySelector(".entry-panel")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
  };

/*
 * Preserve compatibility with the original function
 * names already used by nutrition.js.
 */
window.logAriEstimate =
  window.logAriEstimatedMeal;

window.editAriEstimate =
  window.editAriEstimatedMeal;

// -----------------------------------------------------
// Composer UI
// -----------------------------------------------------

function setNutritionComposerBusy(isBusy) {
  const input = document.getElementById(
    "ariNutritionInput"
  );

  const button = document.getElementById(
    "ariNutritionSendButton"
  ) || document.querySelector(".ari-console-send");

  const shell = document.querySelector(
    ".ari-command-shell"
  );

  if (input) {
    input.disabled = isBusy;
  }

  if (button) {
    button.disabled = isBusy;
    button.setAttribute(
      "aria-busy",
      String(isBusy)
    );
  }

  shell?.classList.toggle(
    "ari-composer-thinking",
    isBusy
  );
}

function setNutritionAriMessage(
  message = "",
  type = "reply"
) {
  const result = document.getElementById(
    "ariAiResult"
  );

  if (!result) return;

  result.classList.remove(
    "error",
    "thinking",
    "reply",
    "success"
  );

  if (type) {
    result.classList.add(type);
  }

  result.textContent = message;
  result.classList.toggle(
    "show",
    Boolean(message)
  );
}

// -----------------------------------------------------
// Utility helpers
// -----------------------------------------------------

function parseDirectCalorieEntry(value) {
  const match = String(value || "")
    .trim()
    .match(
      /^\+?\s*(\d{2,5})\s*(?:cal|calories|kcal)?$/i
    );

  if (!match) return null;

  const calories = Number(match[1]);

  return Number.isFinite(calories) &&
    calories > 0
      ? calories
      : null;
}

function readNumericValue(object, keys = []) {
  if (!object || typeof object !== "object") {
    return NaN;
  }

  for (const key of keys) {
    if (!(key in object)) continue;

    const parsed = parseLooseNumber(object[key]);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return NaN;
}

function readStringValue(object, keys = []) {
  if (!object || typeof object !== "object") {
    return "";
  }

  for (const key of keys) {
    const value = object[key];

    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

function parseLooseNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : NaN;
  }

  const match = String(value || "")
    .replace(/,/g, "")
    .match(/-?\d+(?:\.\d+)?/);

  return match
    ? Number(match[0])
    : NaN;
}

function firstFiniteNumber(values = []) {
  const found = values.find((value) =>
    Number.isFinite(value)
  );

  return Number.isFinite(found)
    ? found
    : 0;
}

function matchNutritionNumber(
  text,
  patterns = []
) {
  for (const pattern of patterns) {
    const match = String(text || "").match(pattern);

    if (match) {
      const value = Number(match[1]);

      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  return 0;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n|;|\u2022/)
      .map((item) =>
        item
          .replace(/^[-*]\s*/, "")
          .trim()
      )
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
}

function normalizeMealCategory(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  const categories = {
    breakfast: "Breakfast",
    lunch: "Lunch",
    dinner: "Dinner",
    snack: "Snack",
    drink: "Drink",
    beverage: "Drink",
    meal: "Meal"
  };

  return categories[normalized] ||
    selectedMealType ||
    "Meal";
}

function normalizeConfidence(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return ["high", "medium", "low", "exact"]
    .includes(normalized)
      ? normalized
      : "medium";
}

function formatConfidenceLabel(value) {
  const confidence =
    normalizeConfidence(value);

  if (confidence === "exact") {
    return "Exact entry";
  }

  return `${confidence[0].toUpperCase()}${confidence.slice(1)} confidence`;
}

function createMealName(description) {
  const clean = String(description || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "Estimated Meal";

  return clean.length > 64
    ? `${clean.slice(0, 61)}...`
    : clean;
}

function setTextContent(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = String(value ?? "");
  }
}

function setInputValueSafe(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.value = value;
  }
}

// -----------------------------------------------------
// Keyboard and form support
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById(
    "ariNutritionComposer"
  );

  /*
   * The newer HTML already has an inline submit
   * handler. Add one only when it is missing.
   */
  if (
    form &&
    !form.getAttribute("onsubmit")
  ) {
    form.addEventListener(
      "submit",
      window.analyzeWithAri
    );
  }

  const input = document.getElementById(
    "ariNutritionInput"
  );

  /*
   * In the original HTML, Enter sends and
   * Shift+Enter creates a new line.
   */
  input?.addEventListener("keydown", (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      window.analyzeWithAri(event);
    }
  });
});
