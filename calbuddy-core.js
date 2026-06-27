// calbuddy-core.js
// CalBuddy Health app brain.
// Level 3 Ari: personalized nutrition coach + wellness support companion.
// Handles auth, reset windows, meals, goals, weight, burned calories,
// AI context, pending actions, barcode/photo hooks, dashboard refresh hooks.
window.CalBuddy = window.CalBuddy || {};
CalBuddy.version = "3.5.3";
CalBuddy.pendingAction = null;
CalBuddy.currentMood = "idle";
/* -----------------------------
BASIC HELPERS
----------------------------- */
CalBuddy.safeNumber = function (value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
CalBuddy.cleanText = function (text = "") {
  return String(text || "").trim();
};
CalBuddy.formatLocalDate = function (date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
CalBuddy.isYes = function (text = "") {
  const t = String(text).trim().toLowerCase();
  return [
    "yes", "yes log it", "log it", "yep", "yeah", "sure",
    "ok", "okay", "do it", "add it", "confirm", "correct"
  ].includes(t);
};
CalBuddy.isNo = function (text = "") {
  const t = String(text).trim().toLowerCase();
  return [
    "no", "nope", "cancel", "don't", "dont",
    "never mind", "nevermind", "stop"
  ].includes(t);
};
/* -----------------------------
API HELPER
----------------------------- */
CalBuddy.api = async function (endpoint, body = {}, options = {}) {
  const method = options.method || "POST";
  const response = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || data.error || `API failed: ${endpoint}`);
  }
  return data;
};
/* -----------------------------
AUTH
----------------------------- */
CalBuddy.getCurrentUser = async function () {
  if (window.getCurrentUser) return await window.getCurrentUser();
  if (!window.calbuddySupabase) return null;
  const { data, error } = await window.calbuddySupabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.user;
};
CalBuddy.requireUser = async function () {
  const user = await CalBuddy.getCurrentUser();
  if (!user) {
    window.location.href = "signin.html";
    throw new Error("User must be signed in.");
  }
  return user;
};
/* -----------------------------
ARI MOODS
----------------------------- */
CalBuddy.allowedMoods = [
  "idle", "thinking", "happy", "celebrate", "sad", "concerned",
  "mad", "shy", "coach", "wow", "laugh", "listening",
  "logging", "success"
];
CalBuddy.setAriMood = function (mood = "idle") {
  if (!CalBuddy.allowedMoods.includes(mood)) mood = "idle";
  CalBuddy.currentMood = mood;
  const ari = document.querySelector("[data-ari-mascot]");
  if (ari) {
    CalBuddy.allowedMoods.forEach(m => ari.classList.remove(`ari-${m}`));
    ari.classList.add(`ari-${mood}`);
    ari.setAttribute("data-mood", mood);
  }
  window.dispatchEvent(new CustomEvent("calbuddy:mood", { detail: { mood } }));
  return mood;
};
CalBuddy.moodFromText = function (text = "") {
  const t = String(text).toLowerCase();
  if (t.includes("congrat") || t.includes("great job") || t.includes("proud")) return "celebrate";
  if (t.includes("sorry") || t.includes("rough") || t.includes("sad")) return "sad";
  if (t.includes("thinking") || t.includes("hmm")) return "thinking";
  if (t.includes("careful") || t.includes("concern") || t.includes("yikes")) return "concerned";
  if (t.includes("haha") || t.includes("lol")) return "laugh";
  if (t.includes("nice") || t.includes("great") || t.includes("good")) return "happy";
  return "idle";
};
/* -----------------------------
RESET WINDOW
----------------------------- */
CalBuddy.getResetTime = async function () {
  const saved = localStorage.getItem("calbuddyResetTime");
  const user = await CalBuddy.getCurrentUser();
  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("profiles")
      .select("reset_hour, reset_minute, reset_ampm")
      .eq("id", user.id)
      .maybeSingle();
    if (!error && data) {
      const resetTime = {
        hour: CalBuddy.safeNumber(data.reset_hour, 4),
        minute: CalBuddy.safeNumber(data.reset_minute, 0),
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
      return { hour: 4, minute: 0, ampm: "AM" };
    }
  }
  return { hour: 4, minute: 0, ampm: "AM" };
};
CalBuddy.convertTo24Hour = function (hour, ampm) {
  hour = Number(hour);
  if (ampm === "AM" && hour === 12) return 0;
  if (ampm === "PM" && hour !== 12) return hour + 12;
  return hour;
};
CalBuddy.getNutritionWindow = async function (offset = 0) {
  const reset = await CalBuddy.getResetTime();
  const resetHour24 = CalBuddy.convertTo24Hour(reset.hour, reset.ampm);
  const now = new Date();
  const start = new Date();
  start.setHours(resetHour24, Number(reset.minute), 0, 0);
  if (now < start) start.setDate(start.getDate() - 1);
  start.setDate(start.getDate() + offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const resetKey =
    `${String(resetHour24).padStart(2, "0")}${String(reset.minute).padStart(2, "0")}`;
  return {
    start,
    end,
    dateKey: `${CalBuddy.formatLocalDate(start)}_${resetKey}`,
    nutritionDate: CalBuddy.formatLocalDate(start)
  };
};
CalBuddy.clearCalorieCache = function () {
  localStorage.removeItem("calbuddyCaloriesConsumed");
  localStorage.removeItem("calbuddyCaloriesBurned");
  localStorage.removeItem("calbuddyActiveNutritionDate");
  Object.keys(localStorage).forEach(key => {
    if (
      key.startsWith("calbuddyCaloriesConsumed_") ||
      key.startsWith("calbuddyCaloriesBurned_")
    ) {
      localStorage.removeItem(key);
    }
  });
};
CalBuddy.changeResetTime = async function ({ hour, minute, ampm }) {
  hour = Number(hour);
  minute = Number(minute);
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    throw new Error("Invalid reset time.");
  }
  const resetTime = { hour, minute, ampm: ampm || "AM" };
  localStorage.setItem("calbuddyResetTime", JSON.stringify(resetTime));
  CalBuddy.clearCalorieCache();
  const user = await CalBuddy.getCurrentUser();
  if (user && window.calbuddySupabase) {
    const { error } = await window.calbuddySupabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          reset_hour: hour,
          reset_minute: minute,
          reset_ampm: resetTime.ampm,
          updated_at: new Date().toISOString()
        },
        { onConflict: "id" }
      );
    if (error) throw error;
  }
  await CalBuddy.refreshDashboard();
  return resetTime;
};
/* -----------------------------
MEALS / CALORIES
----------------------------- */
CalBuddy.saveMealLocally = function (meal) {
  const meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]");
  meals.push({
    id: Date.now(),
    date: meal.nutrition_date,
    ...meal,
    source: "local"
  });
  localStorage.setItem("calbuddyMeals", JSON.stringify(meals));
};
CalBuddy.logMeal = async function (meal) {
  const user = await CalBuddy.getCurrentUser();
  const windowInfo = await CalBuddy.getNutritionWindow();
  const createdAt = new Date().toISOString();
  const mealToSave = {
    name: meal.name || "Ari meal",
    calories: Number(meal.calories || 0),
    category: meal.category || "Meal",
    nutrition_date: meal.nutrition_date || windowInfo.nutritionDate,
    protein_g: Number(meal.protein_g || 0),
    carbs_g: Number(meal.carbs_g || 0),
    fat_g: Number(meal.fat_g || 0),
    serving_size: meal.serving_size || "Added by Ari",
    multiplier: Number(meal.multiplier || 1),
    is_favorite: Boolean(meal.is_favorite || false),
    created_at: createdAt
  };
  if (!mealToSave.calories || mealToSave.calories <= 0) {
    throw new Error("Meal calories are required.");
  }
  CalBuddy.setAriMood("logging");
  if (user && window.calbuddySupabase) {
    const { error } = await window.calbuddySupabase
      .from("meals")
      .insert({ user_id: user.id, ...mealToSave });
    if (error) CalBuddy.saveMealLocally(mealToSave);
  } else {
    CalBuddy.saveMealLocally(mealToSave);
  }
  CalBuddy.clearCalorieCache();
  await CalBuddy.refreshDashboard();
  CalBuddy.setAriMood("success");
  return mealToSave;
};
CalBuddy.getMealsInWindow = async function (offset = 0) {
  const user = await CalBuddy.getCurrentUser();
  const windowInfo = await CalBuddy.getNutritionWindow(offset);
  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", windowInfo.start.toISOString())
      .lt("created_at", windowInfo.end.toISOString())
      .order("created_at", { ascending: true });
    if (!error && data) return data.map(meal => ({ ...meal, source: "supabase" }));
  }
  const meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]");
  return meals
    .filter(meal => {
      const created = new Date(meal.created_at || meal.createdAt || meal.date || meal.nutrition_date);
      return created >= windowInfo.start && created < windowInfo.end;
    })
    .map(meal => ({ ...meal, source: "local" }));
};
CalBuddy.getConsumedCalories = async function () {
  const windowInfo = await CalBuddy.getNutritionWindow();
  const meals = await CalBuddy.getMealsInWindow();
  const total = meals.reduce((sum, meal) => {
    return sum + CalBuddy.safeNumber(meal.calories, 0);
  }, 0);
  localStorage.setItem(`calbuddyCaloriesConsumed_${windowInfo.dateKey}`, Math.round(total));
  localStorage.setItem("calbuddyCaloriesConsumed", Math.round(total));
  localStorage.setItem("calbuddyActiveNutritionDate", windowInfo.dateKey);
  return Math.round(total);
};
CalBuddy.getRecentMeals = async function (limit = 12) {
  const user = await CalBuddy.getCurrentUser();
  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("meals")
      .select("name, calories, category, protein_g, carbs_g, fat_g, serving_size, created_at, nutrition_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error && data) return data;
  }
  const meals = JSON.parse(localStorage.getItem("calbuddyMeals") || "[]");
  return meals.slice(-limit).reverse();
};
CalBuddy.getFavoriteFoods = async function (limit = 10) {
  const user = await CalBuddy.getCurrentUser();
  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("meals")
      .select("name, calories, category, protein_g, carbs_g, fat_g, serving_size")
      .eq("user_id", user.id)
      .eq("is_favorite", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error && data) return data;
  }
  return [];
};
/* -----------------------------
ACTIVITY / BURNED CALORIES
----------------------------- */
CalBuddy.logCaloriesBurned = async function ({ calories_burned, activity_name = "Activity" }) {
  const user = await CalBuddy.getCurrentUser();
  const windowInfo = await CalBuddy.getNutritionWindow();
  const entry = {
    calories_burned: Number(calories_burned || 0),
    activity_name,
    log_date: windowInfo.nutritionDate,
    created_at: new Date().toISOString()
  };
  if (!entry.calories_burned || entry.calories_burned <= 0) {
    throw new Error("Calories burned are required.");
  }
  if (user && window.calbuddySupabase) {
    const { error } = await window.calbuddySupabase
      .from("activity_logs")
      .insert({ user_id: user.id, ...entry });
    if (error) throw error;
  }
  CalBuddy.clearCalorieCache();
  await CalBuddy.refreshDashboard();
  return entry;
};
CalBuddy.getCaloriesBurned = async function () {
  const user = await CalBuddy.getCurrentUser();
  const windowInfo = await CalBuddy.getNutritionWindow();
  const localBurned = CalBuddy.safeNumber(localStorage.getItem(`calbuddyCaloriesBurned_${windowInfo.dateKey}`), 0);
  if (!user || !window.calbuddySupabase) {
    localStorage.setItem("calbuddyCaloriesBurned", localBurned);
    return localBurned;
  }
  const { data, error } = await window.calbuddySupabase
    .from("activity_logs")
    .select("calories_burned, created_at")
    .eq("user_id", user.id)
    .gte("created_at", windowInfo.start.toISOString())
    .lt("created_at", windowInfo.end.toISOString());
  if (error || !data) {
    localStorage.setItem("calbuddyCaloriesBurned", localBurned);
    return localBurned;
  }
  const burned = data.reduce((sum, item) => {
    return sum + CalBuddy.safeNumber(item.calories_burned, 0);
  }, 0);
  localStorage.setItem(`calbuddyCaloriesBurned_${windowInfo.dateKey}`, burned);
  localStorage.setItem("calbuddyCaloriesBurned", burned);
  return burned;
};
/* -----------------------------
PROFILE / WEIGHT / GOALS
----------------------------- */
CalBuddy.normalizeProfileUpdates = function (updates = {}) {
  const normalized = { ...updates };
  if (normalized.current_weight && !normalized.weight_lbs) normalized.weight_lbs = normalized.current_weight;
  if (normalized.weight_lbs && !normalized.current_weight) normalized.current_weight = normalized.weight_lbs;
  if (normalized.goal_weight && !normalized.target_weight_lbs) normalized.target_weight_lbs = normalized.goal_weight;
  if (normalized.target_weight_lbs && !normalized.goal_weight) normalized.goal_weight = normalized.target_weight_lbs;
  if (normalized.targetWeight && !normalized.target_weight_lbs) normalized.target_weight_lbs = normalized.targetWeight;
  if (normalized.gender && !normalized.sex) normalized.sex = normalized.gender;
  if (normalized.sex && !normalized.gender) normalized.gender = normalized.sex;
  if (normalized.height && !normalized.height_in) normalized.height_in = normalized.height;
  if (normalized.height_in && !normalized.height) normalized.height = normalized.height_in;
  if (normalized.activityLevel && !normalized.activity_level) normalized.activity_level = normalized.activityLevel;
  if (normalized.activity_level && !normalized.activityLevel) normalized.activityLevel = normalized.activity_level;
  if (normalized.goalType && !normalized.goal) normalized.goal = normalized.goalType;
  if (normalized.goal && !normalized.goalType) normalized.goalType = normalized.goal;
  if (normalized.weeklyChange && !normalized.weekly_weight_change_goal) {
    normalized.weekly_weight_change_goal = normalized.weeklyChange;
  }
  if (normalized.calorieGoal && !normalized.daily_calorie_goal) {
    normalized.daily_calorie_goal = normalized.calorieGoal;
  }
  return normalized;
};
CalBuddy.updateLocalGoals = function (updates = {}) {
  const goals = JSON.parse(localStorage.getItem("calbuddyGoals") || "{}");
  if (updates.name !== undefined) goals.name = updates.name;
  if (updates.age !== undefined) goals.age = updates.age;
  if (updates.sex !== undefined) goals.sex = updates.sex;
  if (updates.weight_lbs !== undefined) goals.weight = updates.weight_lbs;
  if (updates.height_in !== undefined) goals.height = updates.height_in;
  if (updates.activity_level !== undefined) goals.activity = updates.activity_level;
  if (updates.goal !== undefined) goals.goalMode = updates.goal;
  if (updates.target_weight_lbs !== undefined) goals.targetWeight = updates.target_weight_lbs;
  if (updates.weekly_weight_change_goal !== undefined) goals.weeklyChange = updates.weekly_weight_change_goal;
  if (updates.daily_calorie_goal !== undefined) goals.calorieGoal = updates.daily_calorie_goal;
  localStorage.setItem("calbuddyGoals", JSON.stringify(goals));
  return goals;
};
CalBuddy.updateProfile = async function (updates = {}) {
  const user = await CalBuddy.getCurrentUser();
  const normalized = CalBuddy.normalizeProfileUpdates(updates);
  Object.entries(normalized).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      localStorage.setItem(`calbuddy_${key}`, value);
    }
  });
  if (normalized.daily_calorie_goal) {
    localStorage.setItem("calbuddyDailyCalorieGoal", normalized.daily_calorie_goal);
  }
  if (normalized.weight_lbs) {
    localStorage.setItem("calbuddyCurrentWeight", normalized.weight_lbs);
    localStorage.setItem("calbuddyLatestWeight", normalized.weight_lbs);
  }
  if (normalized.target_weight_lbs) {
    localStorage.setItem("calbuddyGoalWeight", normalized.target_weight_lbs);
  }
  CalBuddy.updateLocalGoals(normalized);
  if (user && window.calbuddySupabase) {
    const supabaseProfile = {
      id: user.id,
      email: user.email || null,
      updated_at: new Date().toISOString()
    };
    [
      "name",
      "age",
      "sex",
      "weight_lbs",
      "height_in",
      "activity_level",
      "goal",
      "target_weight_lbs",
      "weekly_weight_change_goal",
      "daily_calorie_goal",
      "reset_hour",
      "reset_minute",
      "reset_ampm"
    ].forEach(key => {
      if (normalized[key] !== undefined && normalized[key] !== null) {
        supabaseProfile[key] = normalized[key];
      }
    });
    const { error } = await window.calbuddySupabase
      .from("profiles")
      .upsert(supabaseProfile, { onConflict: "id" });
    if (error) throw error;
  }
  await CalBuddy.refreshDashboard();
  return normalized;
};
CalBuddy.logWeight = async function ({ weight, notes = "" }) {
  const user = await CalBuddy.getCurrentUser();
  if (!weight || Number(weight) <= 0) {
    throw new Error("Valid weight is required.");
  }
  const entry = {
    weight: Number(weight),
    notes,
    log_date: CalBuddy.formatLocalDate(new Date()),
    created_at: new Date().toISOString()
  };
  localStorage.setItem("calbuddyCurrentWeight", entry.weight);
  localStorage.setItem("calbuddyLatestWeight", entry.weight);
  if (user && window.calbuddySupabase) {
    await window.calbuddySupabase
      .from("weight_logs")
      .insert({ user_id: user.id, ...entry });
    await CalBuddy.updateProfile({ weight_lbs: entry.weight, current_weight: entry.weight });
  }
  await CalBuddy.refreshDashboard();
  return entry;
};
CalBuddy.getRecentWeights = async function (limit = 8) {
  const user = await CalBuddy.getCurrentUser();
  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("weight_logs")
      .select("weight, log_date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error && data) return data;
  }
  return [];
};
/* -----------------------------
LEVEL 3 CONTEXT
----------------------------- */
CalBuddy.buildCoachMemorySummary = function (context = {}) {
  const mealsToday = Array.isArray(context.mealsToday) ? context.mealsToday : [];
  const recentMeals = Array.isArray(context.recentMeals) ? context.recentMeals : [];
  const favoriteFoods = Array.isArray(context.favoriteFoods) ? context.favoriteFoods : [];
  const recentWeights = Array.isArray(context.recentWeights) ? context.recentWeights : [];
  const todayMealNames = mealsToday.map(m => `${m.name || "meal"} (${m.calories || 0} kcal)`).slice(0, 8).join(", ");
  const recentMealNames = recentMeals.map(m => m.name || "meal").slice(0, 8).join(", ");
  const favoriteNames = favoriteFoods.map(m => m.name || "food").slice(0, 8).join(", ");
  const weightTrend = recentWeights.map(w => `${w.weight} lb`).slice(0, 5).join(" → ");
  return `
You are Ari, CalBuddy's personal AI nutrition coach and supportive wellness companion.
Personality:
- Warm, direct, practical, emotionally intelligent.
- Supportive but honest.
- A little playful when appropriate.
- Never shame the user.
- Be conversational enough that users enjoy coming back.
Nutrition behavior:
- Use the user's calorie goal, calories left, meals, weight, and favorites when available.
- If user feels discouraged about weight gain, explain water weight, sodium, alcohol, food volume, constipation, hormones, and inflammation before assuming fat gain.
- If user asks for a meal plan, create one using the user's calorie goal.
- If user asks to log food, update goals, update weight, or update profile, create a confirmation action when possible.
Social / emotional support behavior:
- You may talk with the user about stress, motivation, cravings, confidence, relationships, discipline, or hard days.
- Do not claim to be a therapist.
- Do not diagnose mental health conditions.
- If user mentions self-harm, suicide, abuse, or immediate danger, respond supportively and encourage emergency/local crisis help.
Current user context:
- Daily calorie goal: ${context.dailyGoal || "unknown"} kcal
- Calories consumed today: ${context.caloriesConsumed || 0} kcal
- Calories burned today: ${context.caloriesBurned || 0} kcal
- Calories left today: ${context.caloriesLeft || 0} kcal
- Current weight: ${context.currentWeight || "unknown"}
- Goal weight: ${context.goalWeight || "unknown"}
- Goal type: ${context.goalType || "unknown"}
- Owner mode: ${context.ownerMode ? "active" : "inactive"}
- Ari mode: ${context.ariModeLabel || "Coach"}
- Ari permissions: ${JSON.stringify(context.ariPermissions || {})}
- Activity level: ${context.activityLevel || "unknown"}
- Meals logged today: ${todayMealNames || "none yet"}
- Recent meals: ${recentMealNames || "none available"}
- Favorite foods: ${favoriteNames || "none saved"}
- Recent weight trend: ${weightTrend || "not enough data"}
`.trim();
};
CalBuddy.getUserContext = async function () {
  const user = await CalBuddy.getCurrentUser();
  const windowInfo = await CalBuddy.getNutritionWindow();
  let goals = {};
  try {
    goals = JSON.parse(localStorage.getItem("calbuddyGoals") || "{}");
  } catch {
    goals = {};
  }
  let profile = {};
  if (user && window.calbuddySupabase) {
    const { data } = await window.calbuddySupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (data) profile = data;
  }
  const dailyGoal =
    CalBuddy.safeNumber(profile.daily_calorie_goal, 0) ||
    CalBuddy.safeNumber(localStorage.getItem("calbuddyDailyCalorieGoal"), 0) ||
    CalBuddy.safeNumber(goals.calorieGoal, 0) ||
    2100;
  const consumed = await CalBuddy.getConsumedCalories();
  const burned = await CalBuddy.getCaloriesBurned();
  const caloriesLeft = Math.max(dailyGoal - consumed + burned, 0);
  const mealsToday = await CalBuddy.getMealsInWindow();
  const recentMeals = await CalBuddy.getRecentMeals(12);
  const favoriteFoods = await CalBuddy.getFavoriteFoods(10);
  const recentWeights = await CalBuddy.getRecentWeights(8);
  const context = {
    userId: user?.id || null,
    email: user?.email || null,
    nutritionWindowStart: windowInfo.start.toISOString(),
    nutritionWindowEnd: windowInfo.end.toISOString(),
    nutritionDate: windowInfo.nutritionDate,
    caloriesConsumed: consumed,
    dailyGoal,
    caloriesBurned: burned,
    caloriesLeft,
    currentWeight:
      profile.weight_lbs ||
      localStorage.getItem("calbuddyCurrentWeight") ||
      localStorage.getItem("calbuddyLatestWeight") ||
      goals.weight ||
      null,
    goalWeight:
      profile.target_weight_lbs ||
      localStorage.getItem("calbuddyGoalWeight") ||
      goals.targetWeight ||
      null,
    height:
      profile.height_in ||
      goals.height ||
      localStorage.getItem("calbuddy_height_in") ||
      null,
    age:
      profile.age ||
      goals.age ||
      localStorage.getItem("calbuddy_age") ||
      null,
    gender:
      profile.sex ||
      goals.sex ||
      localStorage.getItem("calbuddy_sex") ||
      null,
    activityLevel:
      profile.activity_level ||
      goals.activity ||
      localStorage.getItem("calbuddy_activity_level") ||
      null,
    goalType:
      profile.goal ||
      goals.goalMode ||
      localStorage.getItem("calbuddy_goal") ||
      null,
    mealsToday,
    recentMeals,
    favoriteFoods,
    recentWeights,
    profile
  };
  context.ariPermissions = CalBuddy.getAriPermissions(context);
context.ownerMode = CalBuddy.isOwner(context);
context.ariModeLabel = CalBuddy.getAriModeLabel(context);

context.coachMemorySummary = CalBuddy.buildCoachMemorySummary(context);
return context;
};
/* -----------------------------
CLIENT-SIDE ACTION DETECTION
----------------------------- */
CalBuddy.detectAriActionFromMessage = async function (message = "", context = null) {
  const userContext = context || await CalBuddy.getUserContext();

  if (
    !window.Ari?.actionIntentClassifier ||
    !window.Ari?.actionContract
  ) {
    console.log("Ari action classifier not loaded. Skipping client action detection.");
    return null;
  }

  const intent = window.Ari.actionIntentClassifier.classify({
    message,
    userContext,
    context: userContext,
    history: []
  });

  const contract = window.Ari.actionContract.build({
    intent,
    message,
    userContext,
    context: userContext,
    lastMealEstimate: await CalBuddy.getLastAriMealEstimate?.(),
    lastCalorieGoalSuggestion: await CalBuddy.getLastAriCalorieGoalSuggestion?.()
  });

  localStorage.setItem("calbuddyLastActionIntent", JSON.stringify(intent));
  localStorage.setItem("calbuddyLastActionContract", JSON.stringify(contract));

  if (!contract.shouldCreatePendingAction || !contract.action) {
    return null;
  }

  return contract.action;
};
/* -----------------------------
BARCODE / PHOTO / KNOWLEDGE HOOKS
----------------------------- */
CalBuddy.lookupBarcode = async function (barcode) {
  return await CalBuddy.api("/api/barcode", { barcode });
};
CalBuddy.analyzeImage = async function ({ imageBase64, imageUrl, prompt = "", analysisType = "food" }) {
  const user = await CalBuddy.requireUser();
  CalBuddy.setAriMood("thinking");
 
   const result = await CalBuddy.api("/api/image-analyze", {
    imageBase64,
    imageUrl,
    prompt,
    analysisType,
    user_id: user.id
  });
  if (result.pendingAction) {
    CalBuddy.setPendingAction(result.pendingAction);
  }
  CalBuddy.setAriMood(result.pendingAction ? "thinking" : "happy");
  return result;
};
CalBuddy.saveMemory = async function ({ memory_type, memory_key = null, memory_value, source = "conversation" }) {
  const user = await CalBuddy.requireUser();
  return await CalBuddy.api("/api/memory", {
    action: "save_memory",
    user_id: user.id,
    memory_type,
    memory_key,
    memory_value,
    source
  });
};
CalBuddy.getMemories = async function () {
  const user = await CalBuddy.requireUser();
  return await CalBuddy.api("/api/memory", {
    action: "get_memories",
    user_id: user.id
  });
};
CalBuddy.searchKnowledge = async function (query) {
  const user = await CalBuddy.requireUser();
  return await CalBuddy.api("/api/knowledge", {
    action: "search_knowledge",
    user_id: user.id,
    query
  });
};
/* -----------------------------
USAGE LIMITS
----------------------------- */
CalBuddy.checkUsage = async function (usage_type = "chat") {
  const user = await CalBuddy.requireUser();
  return await CalBuddy.api("/api/usage", {
    user_id: user.id,
    action: "check",
    usage_type
  });
};
CalBuddy.logUsage = async function ({ message = "", usage_type = "chat", model = "gpt-4o-mini" }) {
  const user = await CalBuddy.requireUser();
  return await CalBuddy.api("/api/usage", {
    user_id: user.id,
    action: "log",
    message,
    usage_type,
    model
  });
};
/* -----------------------------
PENDING ACTIONS
----------------------------- */
CalBuddy.setPendingAction = function (action) {
  CalBuddy.pendingAction = action;
  localStorage.setItem("calbuddyPendingAction", JSON.stringify(action));
  window.dispatchEvent(new CustomEvent("calbuddy:pendingAction", { detail: { action } }));
  return action;
};
CalBuddy.getPendingAction = function () {
  if (CalBuddy.pendingAction) return CalBuddy.pendingAction;
  const saved = localStorage.getItem("calbuddyPendingAction");
  if (!saved) return null;
  try {
    CalBuddy.pendingAction = JSON.parse(saved);
    return CalBuddy.pendingAction;
  } catch {
    return null;
  }
};
CalBuddy.clearPendingAction = function () {
  CalBuddy.pendingAction = null;
  localStorage.removeItem("calbuddyPendingAction");
  window.dispatchEvent(new CustomEvent("calbuddy:pendingActionCleared"));
};
CalBuddy.createPendingAction = async function ({ action_type, payload, confirmation_text = null }) {
  const user = await CalBuddy.getCurrentUser();
  const action = {
    action_type,
    status: "pending",
    payload: payload || {},
    confirmation_text,
    created_at: new Date().toISOString()
  };
  CalBuddy.setPendingAction(action);
  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("ai_app_actions")
      .insert({ user_id: user.id, ...action })
      .select()
      .single();
    if (!error && data) {
      CalBuddy.setPendingAction(data);
      return data;
    }
  }
  return action;
};
CalBuddy.executeAction = async function (action) {
  const type = action.action_type || action.type;
  const payload = action.payload || {};
  if (type === "log_meal") return await CalBuddy.logMeal(payload);
  if (type === "log_weight") return await CalBuddy.logWeight(payload);
  if (type === "log_calories_burned") return await CalBuddy.logCaloriesBurned(payload);
  if (type === "change_reset_time") return await CalBuddy.changeResetTime(payload);
  if (type === "update_profile" || type === "update_goal_profile") return await CalBuddy.updateProfile(payload);
  if (type === "owner_code_task" || type === "developer_task" || type === "design_change") {
  const context = await CalBuddy.getUserContext();

  if (context.ownerMode !== true) {
    return {
      success: false,
      reply: "Developer tools are only available in Owner Mode."
    };
  }
  const task = CalBuddy.saveDeveloperIntentLocally({
    enabled: true,
    type,
    title: action.title || payload.title || "Owner requested app change",
    summary: action.summary || payload.summary || action.confirmation_text || "Owner confirmed an app improvement request.",
    priority: payload.priority || action.priority || "medium",
    recommended_files: payload.recommended_files || action.recommended_files || ["index.html", "style.css", "calbuddy-core.js", "api/ask-calbuddy.js"],
    ownerCommand: true,
    payload
  });

  return {
    success: true,
    task,
    reply: "Saved to Owner Tasks. I prepared the implementation plan instead of trying to directly edit production code."
  };
}
console.log("ACTION TYPE:", type);
console.log("ACTION:", action);
  return {
  success: false,
  reply: "I don’t recognize that action type."
};
};
CalBuddy.confirmPendingGithubEdit = async function () {
  const saved = localStorage.getItem("calbuddyPendingGithubEdit");

  if (!saved) {
    return {
      success: false,
      reply: "I don’t have a GitHub edit waiting to confirm."
    };
  }

  const developerIntent = JSON.parse(saved);
  const githubEdit = developerIntent.githubEdit || {};

const context = await CalBuddy.getUserContext();

if (context.ownerMode !== true) {
  localStorage.removeItem("calbuddyPendingGithubEdit");

  return {
    success: false,
    reply: "Developer tools are only available in Owner Mode."
  };
}

  if (!githubEdit.filePath) {
    return {
      success: false,
      reply: "I saved the GitHub edit request, but I’m missing the file path."
    };
  }

  if (githubEdit.operation === "replace") {
    if (!githubEdit.find || githubEdit.replace === undefined) {
      return {
        success: false,
        reply: "I saved the GitHub edit request, but I’m missing the exact find/replace text."
      };
    }
  } else if (!githubEdit.newContent) {
    return {
      success: false,
      reply: "I saved the GitHub edit request, but I don’t have replacement content yet."
    };
  }

  const result = await CalBuddy.sendGithubEditRequest({
    owner_access: context.ownerMode === true,
    mode: githubEdit.mode || "commit",
    filePath: githubEdit.filePath,
    operation: githubEdit.operation,
    find: githubEdit.find,
    replace: githubEdit.replace,
    newContent: githubEdit.newContent,
    commitMessage: developerIntent.title || "Ari GitHub edit",
    confirmationText: "CONFIRM GITHUB EDIT"
  });

  if (result.success) {
    localStorage.removeItem("calbuddyPendingGithubEdit");
    localStorage.setItem("calbuddyLastGithubEditResult", JSON.stringify(result));

    return {
      success: true,
      result,
      reply: "GitHub commit created. Vercel should redeploy automatically."
    };
  }

  return {
    success: false,
    result,
    reply: result.error || "The GitHub edit did not go through."
  };
};
CalBuddy.confirmPendingAction = async function () {
  const action = CalBuddy.getPendingAction();
  if (!action) {
    return {
      success: false,
      reply: "I don’t have anything waiting to confirm."
    };
  }
  try {
    const result = await CalBuddy.executeAction(action);
    CalBuddy.clearPendingAction();
    CalBuddy.setAriMood("success");
    return {
  success: true,
  result,
  reply: result?.reply || "Done — I updated that for you."
};
  } catch (error) {
    CalBuddy.setAriMood("concerned");
    return {
      success: false,
      error: error.message,
      reply: "I tried to do that, but something glitched."
    };
  }
};
CalBuddy.cancelPendingAction = function () {
  CalBuddy.clearPendingAction();
  CalBuddy.setAriMood("idle");
  return {
    success: true,
    reply: "No problem — I won’t change that."
  };
};

CalBuddy.isDeveloperCommand = function (message = "") {
  const text = String(message || "").toLowerCase().trim();

  const explicitDevCommand =
    /\b(read|open|show|search|find|update|change|replace|remove|fix|commit|deploy)\b.{0,40}\b(github|repo|repository|vercel|supabase|index\.html|style\.css|calbuddy-core|ari\/|[\w/-]+\.(js|html|css))\b/.test(text) ||
    /\b(github|repo|repository|vercel|supabase|index\.html|style\.css|calbuddy-core|ari\/|[\w/-]+\.(js|html|css))\b.{0,40}\b(read|open|show|search|find|update|change|replace|remove|fix|commit|deploy)\b/.test(text);

  const ownerIntent =
  text.includes("update this file") ||
  text.includes("update the file") ||
  text.includes("send full code") ||
  text.includes("send the full code") ||
  text.includes("commit this") ||
  text.includes("read this file") ||
  text.includes("read the file") ||
  text.includes("search the repo") ||
  text.includes("search github");

  return explicitDevCommand || ownerIntent;
};

/* -----------------------------
ARI TEMP ACTION MEMORY
Stores recent suggestions so "log that" / "set that" can work safely.
----------------------------- */

CalBuddy.saveLastAriMealEstimate = function ({
  name,
  calories,
  category = "Meal",
  serving_size = "Estimated by Ari"
} = {}) {
  if (!name && !calories) return null;

  const estimate = {
    name: name || "Meal from Ari",
    calories: Number(calories || 0),
    category,
    serving_size,
    saved_at: new Date().toISOString()
  };

  localStorage.setItem("calbuddyLastAriMealEstimate", JSON.stringify(estimate));
  return estimate;
};

CalBuddy.getLastAriMealEstimate = async function () {
  const saved = localStorage.getItem("calbuddyLastAriMealEstimate");
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

CalBuddy.saveLastAriCalorieGoalSuggestion = function ({
  calories,
  label = "Suggested by Ari"
} = {}) {
  const value = Number(calories || 0);
  if (!value || value < 1000 || value > 6000) return null;

  const suggestion = {
    calories: value,
    label,
    saved_at: new Date().toISOString()
  };

  localStorage.setItem("calbuddyLastAriCalorieGoalSuggestion", JSON.stringify(suggestion));
  return suggestion;
};

CalBuddy.getLastAriCalorieGoalSuggestion = async function () {
  const saved = localStorage.getItem("calbuddyLastAriCalorieGoalSuggestion");
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

CalBuddy.captureAriTemporarySuggestions = function ({
  userMessage = "",
  reply = "",
  source = "ari"
} = {}) {
  const userText = String(userMessage || "");
  const replyText = String(reply || "");
  const combined = `${userText}\n${replyText}`;

  const calorieRangeMatch =
    replyText.match(/\b(\d{2,4})\s*(?:to|-|–)\s*(\d{2,4})\s*(?:calories|kcal)\b/i) ||
    replyText.match(/\b(\d{2,4})\s*(?:calories|kcal)\b/i);

  const userAskedCalories =
    /\b(how many calories|calories is|calories are|calorie estimate|estimate calories)\b/i.test(userText);

  if (userAskedCalories && calorieRangeMatch) {
    const low = Number(calorieRangeMatch[1]);
    const high = Number(calorieRangeMatch[2] || calorieRangeMatch[1]);
    const estimatedCalories = Math.round((low + high) / 2);

    if (estimatedCalories >= 20 && estimatedCalories <= 5000) {
      CalBuddy.saveLastAriMealEstimate({
        name: userText
          .replace(/how many calories (is|are in|are|does|do)?/gi, "")
          .replace(/\?/g, "")
          .trim() || "Meal from Ari",
        calories: estimatedCalories,
        category: "Meal",
        serving_size: `Estimated by Ari via ${source}`
      });
    }
  }

  const goalSuggestionMatch =
    replyText.match(
      /(?:daily caloric intake|daily calorie intake|daily calories|calorie goal|calorie target|daily intake).{0,100}?(\d{1,2},?\d{3})\s*(?:to|-|–)\s*(\d{1,2},?\d{3})/i
    ) ||
    replyText.match(
      /(?:daily caloric intake|daily calorie intake|daily calories|calorie goal|calorie target|daily intake).{0,100}?(\d{1,2},?\d{3})/i
    );

  if (goalSuggestionMatch) {
    const low = Number(String(goalSuggestionMatch[1]).replace(/,/g, ""));
    const high = Number(String(goalSuggestionMatch[2] || goalSuggestionMatch[1]).replace(/,/g, ""));
    const suggestedCalories = Math.round((low + high) / 2);

    if (suggestedCalories >= 1000 && suggestedCalories <= 6000) {
      CalBuddy.saveLastAriCalorieGoalSuggestion({
        calories: suggestedCalories,
        label: `Suggested by Ari via ${source}`
      });
    }
  }
};

/* -----------------------------
ASK ARI
----------------------------- */
CalBuddy.askAri = async function ({ message, history = [], debugTiming = false }) {
  const timingStart = performance.now();
  const timing = [];

  const mark = (label) => {
    if (!debugTiming) return;
    timing.push({
      label,
      ms: Math.round(performance.now() - timingStart)
    });
  };

  const finishTiming = () => {
    if (!debugTiming) return;
    mark("CalBuddy.askAri complete");
    console.table(timing);
    console.log(
      "[CalBuddy.askAri Timing] Total:",
      Math.round(performance.now() - timingStart) + "ms"
    );
  };
  
  const user = await CalBuddy.requireUser();
mark("requireUser complete");

if (!message || !message.trim()) {
    throw new Error("Message is required.");
  }
  const pendingGithubEdit = localStorage.getItem("calbuddyPendingGithubEdit");

if (pendingGithubEdit && CalBuddy.isYes(message)) {
  return await CalBuddy.confirmPendingGithubEdit();
}
  const pending = CalBuddy.getPendingAction();
  if (pending && CalBuddy.isYes(message)) {
    return await CalBuddy.confirmPendingAction();
  }
  if (pending && CalBuddy.isNo(message)) {
    return CalBuddy.cancelPendingAction();
  }
  mark("before getUserContext");
const userContext = await CalBuddy.getUserContext();
mark("after getUserContext");

mark("before detectAriActionFromMessage");
const quickAction = await CalBuddy.detectAriActionFromMessage(message, userContext);
mark("after detectAriActionFromMessage");
  
  if (quickAction) {
    const action = await CalBuddy.createPendingAction(quickAction);
    CalBuddy.setAriMood("coach");
    return {
      reply: action.confirmation_text || "I can update that. Want me to do it?",
      pendingAction: action,
      emotion: "coach"
    };
  }
 
  mark("before checkUsage");
  
   const usage = await CalBuddy.checkUsage("chat");
  if (usage && usage.allowed === false) {
    CalBuddy.setAriMood("concerned");
    return {
      reply: usage.message || "You’ve reached today’s AI limit.",
      blocked: true
    };
  }
  CalBuddy.setAriMood("thinking");
  
  
mark("after checkUsage");
/* -----------------------------
ARI REBIRTH LOCAL BRIDGE
Rebirth-only app brain. Old server Ari remains below as emergency API fallback
only if Rebirth bridge is not loaded.
----------------------------- */

console.log("REBIRTH LOAD CHECK:", {
  bridge: window.AriRebirthAppBridge?.version,
  pipeline: window.AriRebirthPipeline?.version,
  safety: window.AriSafetyContextGate?.version,
  observer: window.Ari?.observerNetwork?.version,
  situationMap: window.AriSituationMapEngine?.version,
  triage: window.AriTriageEngine?.version,
  contract: window.AriSituationContract?.version,
  composer: window.AriLanguageComposer?.version
});

if (
  window.AriRebirthAppBridge &&
  typeof window.AriRebirthAppBridge.ask === "function"
) {
  mark("before AriRebirthAppBridge.ask");

const rebirth = await window.AriRebirthAppBridge.ask(message, {
  source: "calbuddy-core",
  page: window.location.pathname || "unknown",
  history,
  debugTiming,

    userContext,

    user: {
      id: userContext.userId || user.id,
      email: userContext.email || user.email || null
    },

    goals: {
      dailyGoal: userContext.dailyGoal,
      caloriesConsumed: userContext.caloriesConsumed,
      caloriesBurned: userContext.caloriesBurned,
      caloriesLeft: userContext.caloriesLeft,
      currentWeight: userContext.currentWeight,
      goalWeight: userContext.goalWeight,
      goalType: userContext.goalType,
      activityLevel: userContext.activityLevel,
      nutritionDate: userContext.nutritionDate
    },

    meals: userContext.mealsToday || [],
    todayLog: userContext.mealsToday || [],
    recentMeals: userContext.recentMeals || [],
    favoriteFoods: userContext.favoriteFoods || [],
    recentWeights: userContext.recentWeights || [],

    ownerMode: userContext.ownerMode === true,
    ariPermissions: userContext.ariPermissions || {},
      coachMemorySummary: userContext.coachMemorySummary || ""
});

mark("after AriRebirthAppBridge.ask");

  mark("before logUsage");
await CalBuddy.logUsage({ message, usage_type: "chat" });
mark("after logUsage");

  const mood = rebirth.emotion || "happy";
CalBuddy.setAriMood(mood);

CalBuddy.captureAriTemporarySuggestions({
  userMessage: message,
  reply: rebirth.reply || "",
  source: "rebirth"
});

  const currentMessageIsDeveloperCommand = CalBuddy.isDeveloperCommand(message);

if (
  currentMessageIsDeveloperCommand &&
  (rebirth.developerIntent || rebirth.summary?.developerIntent)
) {
    const handledIntent = await CalBuddy.handleDeveloperIntent({
      developerIntent: rebirth.developerIntent || rebirth.summary?.developerIntent,
      originalMessage: message,
      userContext,
      history
    });

    if (handledIntent) {
      CalBuddy.setAriMood(handledIntent.emotion || "thinking");

      return {
        ...handledIntent,
        pendingAction: null,
        memoryCandidate: null,
        rebirthSummary: rebirth.summary
      };
    }
  }

  if (Array.isArray(rebirth.actions) && rebirth.actions.length > 0) {
    const firstAction = rebirth.actions[0];

    if (firstAction.requiresApproval !== false) {
      const pendingAction = await CalBuddy.createPendingAction({
        action_type: firstAction.action_type || firstAction.type,
        payload: firstAction.payload || {},
        confirmation_text:
          firstAction.confirmation_text ||
          firstAction.confirmationText ||
          "I can do that. Want me to confirm it?"
      });

      return {
        reply:
          pendingAction.confirmation_text ||
          rebirth.reply ||
          "I can do that. Want me to confirm it?",
        emotion: mood,
        pendingAction,
        memoryCandidate: null,
        developerIntent: null,
        rebirthSummary: rebirth.summary
      };
    }
  }

  finishTiming();

return {
  reply: rebirth.reply,
  emotion: mood,
  pendingAction: null,
  memoryCandidate: null,
  developerIntent: null,
  rebirthSummary: rebirth.summary
};
}
  
  const response = await CalBuddy.api("/api/ask-calbuddy", {
    message,
    userContext,
    coachMemorySummary: userContext.coachMemorySummary,
    history: history.slice(-20),
    ariLevel: 3,
    modes: {
      nutrition: true,
      wellnessSupport: true,
      socialCompanion: true,
      barcodeReady: true,
      photoAnalysisReady: true
    }
  });
  mark("before logUsage");
await CalBuddy.logUsage({ message, usage_type: "chat" });
mark("after logUsage");
  if (response.pendingAction) {
    CalBuddy.setPendingAction(response.pendingAction);
  }
  if (response.memoryCandidate) {
  localStorage.setItem(
    "calbuddyLastMemoryCandidate",
    JSON.stringify(response.memoryCandidate)
  );

  CalBuddy.saveAriMemoryCandidate(response.memoryCandidate);

  window.dispatchEvent(
    new CustomEvent("calbuddy:memoryCandidate", {
      detail: { memoryCandidate: response.memoryCandidate }
    })
  );

  console.log("CalBuddy Memory Candidate:", response.memoryCandidate);
}

if (CalBuddy.isDeveloperCommand(message) && response.developerIntent) {
  localStorage.setItem(
    "calbuddyLastDeveloperIntent",
    JSON.stringify(response.developerIntent)
  );

  CalBuddy.saveDeveloperIntentLocally(response.developerIntent);

  if (response.developerIntent.githubEdit) {
    localStorage.setItem(
      "calbuddyPendingGithubEdit",
      JSON.stringify(response.developerIntent)
    );
  }

  window.dispatchEvent(
    new CustomEvent("calbuddy:developerIntent", {
      detail: { developerIntent: response.developerIntent }
    })
  );

  console.log("CalBuddy Developer Intent:", response.developerIntent);

if (response.developerIntent?.type === "github_read_request") {
  const filePath =
    response.developerIntent.filePath ||
    response.developerIntent.githubRead?.filePath;

  if (filePath) {
    const readResult = await CalBuddy.readGithubFile(filePath);

    if (readResult.success) {
      const analysisResponse = await CalBuddy.api("/api/ask-calbuddy", {
  message: `The owner asked: "${message}"

You just read this GitHub file.

Analyze the file content and answer the owner's request.

Answer in 3 short bullets maximum.
Do not use markdown headings.
Do not explain basic sections unless the owner asked for a full file summary.
Do not paste large code blocks.
Do not repeat file contents.
Focus on:
- what the file does
- likely location of the requested feature
- likely bug cause
- recommended next step

Be specific.`,
userContext: userContext,
        coachMemorySummary: userContext.coachMemorySummary,
        history: history.slice(-10),
        githubFileContext: {
          filePath,
          content: readResult.content
        },
        ariLevel: 3,
        modes: {
          nutrition: true,
          wellnessSupport: true,
          socialCompanion: true,
          developerFileAnalysis: true
        }
      });

      response.reply =
        analysisResponse.reply ||
        `Successfully read ${filePath}.`;

      response.emotion =
        analysisResponse.emotion ||
        response.emotion ||
        "thinking";

      response.developerIntent =
        analysisResponse.developerIntent ||
        response.developerIntent;

      response.pendingAction =
        analysisResponse.pendingAction ||
        response.pendingAction;

      response.memoryCandidate =
        analysisResponse.memoryCandidate ||
        response.memoryCandidate;

      response.githubReadResult = {
        filePath,
        content: readResult.content
      };
    } else {
      response.reply =
        readResult.error ||
        "I could not read that file.";
    }
  }
}
if (response.developerIntent?.type === "github_search_request") {
  const query =
    response.developerIntent.query ||
    response.developerIntent.searchQuery ||
    response.developerIntent.githubSearch?.query;

  if (query) {
    const searchResult = await CalBuddy.searchGithubCode(query);

    if (searchResult.success) {
      const resultsText = (searchResult.results || [])
        .map(item => `- ${item.path}`)
        .join("\n");

      response.githubSearchResult = searchResult;

      response.reply =
        searchResult.count > 0
          ? `I found ${searchResult.count} result(s) for "${query}":\n${resultsText}`
          : `I searched for "${query}" but did not find a match.`;
    } else {
      response.reply =
        searchResult.error ||
        "I could not search the repository.";
    }
  }
}
}
const mood =
    response.emotion ||
    response.mood ||
    CalBuddy.moodFromText(response.reply || "");
  CalBuddy.setAriMood(mood);

finishTiming();
return response;
};

/* -----------------------------
ARI INTELLIGENCE FOUNDATION
Dynamic greetings, owner mode, simple patterns
----------------------------- */

CalBuddy.isOwner = function (context = {}) {
  const profile = context.profile || {};
  return profile.owner_access === true;
};
CalBuddy.getAriPermissions = function (context = {}) {
  const owner = CalBuddy.isOwner(context);

  return {
    owner_access: owner,
    read_app_data: true,
    update_profile: true,
    log_meals: true,
    log_weight: true,
    update_goals: true,
    save_memory: owner,
    create_developer_tasks: owner,
    suggest_code_changes: owner,
    direct_code_editing: owner
  };
};
CalBuddy.getAriModeLabel = function (context = {}) {
  const profile = context.profile || {};
  const mode = profile.ari_mode || "auto";

  if (!CalBuddy.isOwner(context)) return "Coach";

  if (mode === "developer_wonder") return "Developer + Wonder";
  if (mode === "companion_wonder") return "Companion + Wonder";
  if (mode === "coach_wonder") return "Coach + Wonder";

  return "Auto Mode";
};

CalBuddy.buildPatternSummary = function (context = {}) {
  const mealsToday = Array.isArray(context.mealsToday) ? context.mealsToday : [];
  const recentMeals = Array.isArray(context.recentMeals) ? context.recentMeals : [];
  const recentWeights = Array.isArray(context.recentWeights) ? context.recentWeights : [];

  const patterns = [];

  if (mealsToday.length === 0) {
    patterns.push("No meals logged yet today.");
  }

  if (recentMeals.length >= 3) {
    const names = recentMeals
      .map(meal => String(meal.name || "").toLowerCase())
      .filter(Boolean);

    const repeated = names.find((name, index) => names.indexOf(name) !== index);

    if (repeated) {
      patterns.push(`Repeated recent food: ${repeated}.`);
    }
  }

  if (recentWeights.length >= 2) {
    const latest = CalBuddy.safeNumber(recentWeights[0]?.weight, 0);
    const previous = CalBuddy.safeNumber(recentWeights[recentWeights.length - 1]?.weight, 0);

    if (latest && previous) {
      const difference = latest - previous;

      if (Math.abs(difference) >= 2) {
        patterns.push(
          difference > 0
            ? `Weight is up about ${difference.toFixed(1)} lb across recent logs.`
            : `Weight is down about ${Math.abs(difference).toFixed(1)} lb across recent logs.`
        );
      }
    }
  }

  return patterns.length ? patterns.join(" ") : "No strong pattern detected yet.";
};

CalBuddy.getHomepageGreeting = async function () {
  const context = await CalBuddy.getUserContext();

  const owner = CalBuddy.isOwner(context);
  const modeLabel = CalBuddy.getAriModeLabel(context);

  const hour = new Date().getHours();
  const consumed = Number(context.caloriesConsumed || 0);
  const burned = Number(context.caloriesBurned || 0);
  const goal = Number(context.dailyGoal || 2100);
  const left = Number(context.caloriesLeft || 0);
  const netCalories = Math.max(consumed - burned, 0);

  let timeGreeting = "Hey.";
  if (hour < 12) timeGreeting = "Good morning.";
  else if (hour < 17) timeGreeting = "Good afternoon.";
  else timeGreeting = "Good evening.";

  if (owner) {
    if (consumed === 0) {
      return `${timeGreeting} Owner Mode is active: ${modeLabel}.\n\nNo meals logged yet. We can build, debug, or start your day strong.`;
    }

    return `${timeGreeting} Owner Mode is active: ${modeLabel}.\n\nYou have ${left.toLocaleString()} calories left. CalBuddy is ready for coaching, product work, or debugging.`;
  }

  if (consumed === 0) {
    return `${timeGreeting} You haven't logged anything yet. What are we eating first?`;
  }

  if (netCalories < goal * 0.5) {
    return `${timeGreeting} You're on track today. Keep it going.`;
  }

  if (netCalories <= goal) {
    return `${timeGreeting} Nice work. You're still within your calorie goal.`;
  }

  return `${timeGreeting} You're over goal today, but one day doesn't define you. Let's look at the whole pattern.`;
};

CalBuddy.getOwnerStatusSummary = async function () {
  const context = await CalBuddy.getUserContext();

  if (!CalBuddy.isOwner(context)) {
    return "Owner status is not available on this account.";
  }

  const modeLabel = CalBuddy.getAriModeLabel(context);
  const patternSummary = CalBuddy.buildPatternSummary(context);

  return [
    `Owner Mode: ${modeLabel}`,
    `Calories today: ${context.caloriesConsumed || 0} consumed / ${context.dailyGoal || 0} goal`,
    `Calories left: ${context.caloriesLeft || 0}`,
    `Meals today: ${Array.isArray(context.mealsToday) ? context.mealsToday.length : 0}`,
    `Pattern note: ${patternSummary}`,
    "Next build priorities: dynamic greetings, memory storage, Developer + Wonder task saving, homepage chat compression."
  ].join("\n");
};

CalBuddy.saveAriMemoryCandidate = async function (memoryCandidate) {
  if (!memoryCandidate || !memoryCandidate.memory_value) return null;

  try {
    return await CalBuddy.saveMemory({
      memory_type: memoryCandidate.memory_type || "preference",
      memory_key: memoryCandidate.memory_key || null,
      memory_value: memoryCandidate.memory_value,
      source: "ari"
    });
  } catch (error) {
    console.log("Memory save skipped:", error.message);
    return null;
  }
};

CalBuddy.handleDeveloperIntent = async function ({
  developerIntent,
  originalMessage = "",
  userContext = null,
  history = []
} = {}) {
  if (!developerIntent || developerIntent.enabled === false) {
    return null;
  }

if (userContext?.ownerMode !== true) {
  return {
    reply: "Developer tools are only available in Owner Mode.",
    emotion: "concerned",
    developerIntent: null
  };
}

  localStorage.setItem(
    "calbuddyLastDeveloperIntent",
    JSON.stringify(developerIntent)
  );

  CalBuddy.saveDeveloperIntentLocally(developerIntent);

  window.dispatchEvent(
    new CustomEvent("calbuddy:developerIntent", {
      detail: { developerIntent }
    })
  );

  if (developerIntent.type === "developer_investigation") {
    return await CalBuddy.runDeveloperInvestigation({
      developerIntent,
      originalMessage,
      userContext,
      history
    });
  }

  if (developerIntent.githubEdit) {
    localStorage.setItem(
      "calbuddyPendingGithubEdit",
      JSON.stringify(developerIntent)
    );

    return {
      reply:
        developerIntent.githubEdit.confirmationText ||
        "I prepared a GitHub edit request. Say yes to commit it.",
      emotion: "thinking",
      developerIntent
    };
  }

    if (developerIntent.type === "github_read_request") {
    const filePath =
      developerIntent.filePath ||
      developerIntent.githubRead?.filePath;

    if (!filePath) {
      return {
        reply: "I need the file path before I can read it.",
        emotion: "concerned",
        developerIntent
      };
    }

    const readResult = await CalBuddy.readGithubFile(filePath);

    if (!readResult.success) {
      return {
        reply: readResult.error || "I could not read that file.",
        emotion: "concerned",
        developerIntent
      };
    }

    const analysisResponse = await window.AriRebirthAppBridge.ask(
  `OWNER REQUEST:

${originalMessage}`,
      {
        source: "calbuddy-core-github-read",
        page: window.location.pathname || "unknown",
        history: history.slice(-10),

        userContext: userContext || await CalBuddy.getUserContext(),
        coachMemorySummary: userContext?.coachMemorySummary || "",

        ownerMode: true,
        ariPermissions: userContext?.ariPermissions || {},

        githubFileContext: {
          filePath,
          content: readResult.content,
          contentLength:
            readResult.contentLength ||
            readResult.content?.length ||
            0
        }
      }
    );

    return {
      reply: analysisResponse.reply || `I read ${filePath}.`,
      emotion: analysisResponse.emotion || "thinking",
      developerIntent: analysisResponse.developerIntent || developerIntent,
      githubReadResult: readResult,
      rebirthSummary: analysisResponse.summary
    };
  }

  if (developerIntent.type === "github_search_request") {
    const query =
      developerIntent.query ||
      developerIntent.searchQuery ||
      developerIntent.githubSearch?.query;

    if (!query) {
      return {
        reply: "I need a search term before I can search the repository.",
        emotion: "concerned",
        developerIntent
      };
    }

    const searchResult = await CalBuddy.searchGithubCode(query);

    if (!searchResult.success) {
      return {
        reply: searchResult.error || "I could not search the repository.",
        emotion: "concerned",
        developerIntent
      };
    }

    const resultsText = (searchResult.results || [])
      .map(item => `- ${item.path}`)
      .join("\n");

    return {
      reply:
        searchResult.count > 0
          ? `I found ${searchResult.count} result(s) for "${query}":\n${resultsText}`
          : `I searched for "${query}" but did not find a match.`,
      emotion: "thinking",
      developerIntent,
      githubSearchResult: searchResult
    };
  }

  return {
    reply:
      developerIntent.summary ||
      "I saved this as an owner developer task.",
    emotion: "thinking",
    developerIntent
  };
};

CalBuddy.runDeveloperInvestigation = async function ({
  developerIntent,
  originalMessage = "",
  userContext = null,
  history = []
} = {}) {
  const steps = Array.isArray(developerIntent.steps)
    ? developerIntent.steps
    : [];

  const searchResults = [];
  const readResults = [];

  for (const step of steps) {
    if (step.tool === "github_search" && step.query) {
      const result = await CalBuddy.searchGithubCode(step.query);
      searchResults.push({
        query: step.query,
        result
      });
    }

    if (step.tool === "github_read" && step.filePath) {
      const result = await CalBuddy.readGithubFile(step.filePath);
      readResults.push({
        filePath: step.filePath,
        result
      });
    }
  }

  localStorage.setItem(
    "calbuddyLastDeveloperInvestigation",
    JSON.stringify({
      developerIntent,
      searchResults,
      readResults,
      created_at: new Date().toISOString()
    })
  );

  const readableFiles = readResults
    .filter(item => item.result?.success && item.result?.content)
    .slice(0, 3);

  if (readableFiles.length > 0) {
    const fileContext = readableFiles[0];

    const analysisResponse = await window.AriRebirthAppBridge.ask(
  `The owner asked: "${originalMessage}"

Ari Rebirth investigated this request.

Developer intent:
${JSON.stringify(developerIntent, null, 2)}

Search results:
${JSON.stringify(searchResults, null, 2).slice(0, 8000)}

Now analyze the file content and decide the safest next step.

If you can identify an exact safe edit, return developerIntent.githubEdit with exact find/replace text.
If not, explain what file or code needs to be read next.

Do not guess find text.
Do not claim anything was changed.`,
  {
    source: "calbuddy-core-developer-investigation",
    page: window.location.pathname || "unknown",
    history: history.slice(-10),

    userContext: userContext || await CalBuddy.getUserContext(),
    coachMemorySummary: userContext?.coachMemorySummary || "",

    ownerMode: true,
    ariPermissions: userContext?.ariPermissions || {},

    githubFileContext: {
      filePath: fileContext.filePath,
      content: fileContext.result.content
    },

    developerInvestigation: {
      developerIntent,
      searchResults,
      readResults
    }
  }
);

    if (analysisResponse.developerIntent?.githubEdit) {
      localStorage.setItem(
        "calbuddyPendingGithubEdit",
        JSON.stringify(analysisResponse.developerIntent)
      );
    }

    return {
      reply: analysisResponse.reply || "I analyzed the code and prepared the next step.",
      emotion: analysisResponse.emotion || "thinking",
      developerIntent: analysisResponse.developerIntent || developerIntent,
      pendingAction: analysisResponse.pendingAction || null,
      memoryCandidate: analysisResponse.memoryCandidate || null,
      developerInvestigation: {
        searchResults,
        readResults
      }
    };
  }

  return {
    reply:
      searchResults.length > 0
        ? `I searched ${searchResults.length} term(s), but I still need to read the most relevant file before proposing an edit.`
        : "I could not gather enough code evidence yet.",
    emotion: "thinking",
    developerIntent,
    developerInvestigation: {
      searchResults,
      readResults
    }
  };
};

CalBuddy.searchGithubCode = async function (query) {
  try {
    const context = await CalBuddy.getUserContext();

    const response = await fetch("/api/ari-github-search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        owner_access: context.ownerMode === true,
        query
      })
    });

    const data = await response.json();

    console.log("GitHub Search Response:", data);

    return data;
  } catch (err) {
    console.error("GitHub Search Error:", err);

    return {
      success: false,
      error: err.message
    };
  }
};
CalBuddy.sendGithubEditRequest = async function (payload) {
  try {
    const response = await fetch("/api/ari-github-edit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    console.log("GitHub Edit Response:", data);

    return data;
  } catch (err) {
    console.error("GitHub Edit Error:", err);

    return {
      success: false,
      error: err.message
    };
  }
};
CalBuddy.readGithubFile = async function (filePath) {
  try {
    const context = await CalBuddy.getUserContext();

    const response = await fetch("/api/ari-github-read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        owner_access: context.ownerMode === true,
        filePath
      })
    });

    const data = await response.json();

    console.log("GitHub Read Response:", data);

    return data;

  } catch (err) {

    console.error("GitHub Read Error:", err);

    return {
      success: false,
      error: err.message
    };
  }
};
CalBuddy.saveDeveloperIntentLocally = function (developerIntent) {
  if (!developerIntent) return null;

  const tasks = JSON.parse(localStorage.getItem("calbuddyDeveloperTasks") || "[]");

  const task = {
    id: Date.now(),
    created_at: new Date().toISOString(),
    ...developerIntent
  };

  tasks.unshift(task);
  localStorage.setItem("calbuddyDeveloperTasks", JSON.stringify(tasks.slice(0, 50)));

  return task;
};
/* -----------------------------
DASHBOARD REFRESH
----------------------------- */
CalBuddy.refreshDashboard = async function () {
  const context = await CalBuddy.getUserContext();
  window.dispatchEvent(new CustomEvent("calbuddy:dashboardUpdated", {
    detail: context
  }));
  return context;
};
/* -----------------------------
INIT
----------------------------- */
CalBuddy.init = async function () {
  CalBuddy.getPendingAction();
  CalBuddy.setAriMood("idle");
  try {
    await CalBuddy.refreshDashboard();
  } catch {
    console.log("Dashboard refresh skipped.");
  }
  console.log("CalBuddy core loaded.", CalBuddy.version);
};
document.addEventListener("DOMContentLoaded", () => {
  CalBuddy.init();
});
