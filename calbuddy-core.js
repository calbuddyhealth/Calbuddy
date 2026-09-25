// calbuddy-core.js
// CalBuddy Health app brain.
// Level 3 Ari: personalized nutrition coach + wellness support companion.
// Handles auth, reset windows, meals, goals, weight, burned calories,
// AI context, pending actions, barcode/photo hooks, dashboard refresh hooks.
window.CalBuddy = window.CalBuddy || {};
CalBuddy.version = "3.8.0";
CalBuddy.pendingAction = null;
CalBuddy.currentMood = "idle";
CalBuddy.dashboardRefreshPromise = null;
CalBuddy.ownerSessionCache = null;
CalBuddy.ownerSessionVerification = null;

CalBuddy.exposeSupabaseToAri = function () {
  const client =
    window.calbuddySupabase ||
    window.supabaseClient ||
    window.CalBuddy?.supabase ||
    null;

  if (!client) return null;

  window.CalBuddy.supabase = client;
  window.supabaseClient = client;

  return client;
};

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
  const headers = { "Content-Type": "application/json" };

  if (options.authenticated === true) {
    const session = await CalBuddy.getCurrentSession();
    const accessToken = String(session?.access_token || "").trim();

    if (!accessToken) {
      throw new Error("A signed-in session is required.");
    }

    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(endpoint, {
    method,
    headers,
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
CalBuddy.getCurrentSession = async function () {
  if (typeof window.getCurrentSession === "function") {
    return await window.getCurrentSession();
  }

  if (!window.calbuddySupabase) return null;

  const { data, error } =
    await window.calbuddySupabase.auth.getSession();

  if (error || !data?.session) return null;

  return data.session;
};
CalBuddy.getCurrentUser = async function () {
  const session = await CalBuddy.getCurrentSession();
  return session?.user || null;
};
CalBuddy.getOwnerRequestHeaders = async function () {
  const session = await CalBuddy.getCurrentSession();
  const accessToken = String(session?.access_token || "").trim();

  if (!accessToken) {
    throw new Error("A signed-in Supabase session is required.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`
  };
};

CalBuddy.requestVisualInspector = async function (body = {}) {
  const headers = await CalBuddy.getOwnerRequestHeaders();
  const response = await fetch("/api/ari-visual-inspector", {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(body || {})
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ...data,
      success: false,
      status: data?.status || "failed",
      httpStatus: response.status,
      code: data?.code || "ARI_VISUAL_INSPECTOR_HTTP_ERROR",
      error:
        data?.error ||
        data?.message ||
        "ARI visual inspection request failed."
    };
  }

  return data;
};

CalBuddy.runVisualInspection = async function ({
  message = "",
  targetPath = "/home.html",
  viewports = "both",
  actions = [],
  resumeRequestId = null,
  visualMode = "sandbox"
} = {}) {
  const instruction = String(message || "").trim();

  let requestId = String(resumeRequestId || "").trim();

  if (!requestId) {
    if (visualMode === "live_owner") {
      try {
        await (window.calbuddySupabase || CalBuddy.supabase)?.auth?.refreshSession?.();
      } catch {}
    }

    const liveOwnerState =
      visualMode === "live_owner"
        ? CalBuddy.getVisualLiveOwnerSession?.()
        : null;

    const started = await CalBuddy.requestVisualInspector({
      action: "start",
      targetPath,
      viewports,
      actions,
      instruction,
      visualMode,
      liveOwnerExpiresAt:
        visualMode === "live_owner"
          ? Number(liveOwnerState?.expiresAt || 0)
          : null
    });

    if (!started?.success || !started?.requestId) {
      return started;
    }

    requestId = started.requestId;
    localStorage.setItem(
      "calbuddyPendingVisualInspection",
      JSON.stringify({
        requestId,
        targetPath,
        viewports,
        visualMode,
        instruction,
        startedAt: new Date().toISOString()
      })
    );
  }

  const maxPolls = 40;
  const pollDelayMs = 2250;

  for (let attempt = 0; attempt < maxPolls; attempt += 1) {
    const status = await CalBuddy.requestVisualInspector({
      action: "status",
      requestId,
      instruction
    });

    if (status?.status === "completed") {
      localStorage.removeItem("calbuddyPendingVisualInspection");
      const completedSession = await CalBuddy.getCurrentSession().catch(() => null);
      localStorage.setItem(
        "calbuddyLastVisualInspection",
        JSON.stringify({
          requestId,
          completedAt: new Date().toISOString(),
          userId: completedSession?.user?.id || null,
          targetPath,
          instruction,
          visualMode: status.visualMode || visualMode || "sandbox",
          visualAnalysis: status.visualAnalysis || null,
          evidence: status.evidence || null
        })
      );
      return status;
    }

    if (status?.status === "failed" || status?.success === false) {
      localStorage.removeItem("calbuddyPendingVisualInspection");
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, pollDelayMs));
  }

  return {
    success: true,
    status: "in_progress",
    requestId,
    targetPath,
    message:
      "The visual browser worker is still running. Ari can resume this exact inspection without starting over."
  };
};

CalBuddy.getPendingVisualInspection = function () {
  const saved = localStorage.getItem("calbuddyPendingVisualInspection");
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem("calbuddyPendingVisualInspection");
    return null;
  }
};

CalBuddy.getVisualLiveOwnerSession = function () {
  const key = "calbuddyVisualLiveOwnerSession";
  const saved = localStorage.getItem(key);
  if (!saved) return null;

  try {
    const state = JSON.parse(saved);
    if (
      state?.mode !== "live_owner" ||
      !state?.userId ||
      !Number.isFinite(Number(state?.expiresAt)) ||
      Number(state.expiresAt) <= Date.now()
    ) {
      localStorage.removeItem(key);
      return null;
    }
    return state;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

CalBuddy.isVisualLiveOwnerSessionActive = async function () {
  const state = CalBuddy.getVisualLiveOwnerSession();
  if (!state) return false;

  const session = await CalBuddy.getCurrentSession();
  if (!session?.user?.id || String(session.user.id) !== String(state.userId)) {
    localStorage.removeItem("calbuddyVisualLiveOwnerSession");
    return false;
  }

  const verified = await CalBuddy.verifyOwnerSession();
  if (!verified) {
    localStorage.removeItem("calbuddyVisualLiveOwnerSession");
    return false;
  }

  return true;
};

CalBuddy.enableVisualLiveOwnerSession = async function ({
  durationMinutes = 45
} = {}) {
  const client = window.calbuddySupabase || CalBuddy.supabase;
  if (!client?.auth) {
    return {
      success: false,
      code: "LIVE_OWNER_AUTH_UNAVAILABLE",
      reply: "Live Owner Session is unavailable because authentication is not ready."
    };
  }

  let session = null;
  try {
    const refreshed = await client.auth.refreshSession();
    session = refreshed?.data?.session || null;
  } catch {}

  if (!session) session = await CalBuddy.getCurrentSession();

  if (!session?.access_token || !session?.user?.id) {
    return {
      success: false,
      code: "LIVE_OWNER_AUTH_REQUIRED",
      reply: "Live Owner Session requires a current signed-in owner session."
    };
  }

  const owner = await CalBuddy.verifyOwnerSession({ force: true });
  if (!owner) {
    return {
      success: false,
      code: "OWNER_ACCESS_DENIED",
      reply: "Live Owner Session requires verified Owner Mode."
    };
  }

  const requestedMs =
    Math.max(10, Math.min(60, Number(durationMinutes) || 45)) * 60 * 1000;
  const tokenExpiryMs = Number(session.expires_at || 0) * 1000;
  const expiresAt = tokenExpiryMs
    ? Math.min(Date.now() + requestedMs, tokenExpiryMs - 60_000)
    : Date.now() + requestedMs;

  if (expiresAt <= Date.now() + 5 * 60 * 1000) {
    return {
      success: false,
      code: "LIVE_OWNER_SESSION_TOO_SHORT",
      reply: "I could not establish a long-enough owner session. Sign in again and retry."
    };
  }

  const state = {
    mode: "live_owner",
    userId: String(session.user.id),
    enabledAt: Date.now(),
    expiresAt
  };

  localStorage.setItem(
    "calbuddyVisualLiveOwnerSession",
    JSON.stringify(state)
  );

  window.dispatchEvent(
    new CustomEvent("calbuddy:liveOwnerSessionChanged", {
      detail: { active: true, ...state }
    })
  );

  const minutes = Math.max(1, Math.round((expiresAt - Date.now()) / 60000));
  return {
    success: true,
    state,
    reply:
      `Live Owner Session is active for about ${minutes} minutes. Visual inspections can now use your real ARI XP account state; AI processing is temporarily authorized only for this scoped visual inspection, and browser-side production mutations remain blocked.`
  };
};

CalBuddy.disableVisualLiveOwnerSession = function () {
  localStorage.removeItem("calbuddyVisualLiveOwnerSession");
  window.dispatchEvent(
    new CustomEvent("calbuddy:liveOwnerSessionChanged", {
      detail: { active: false }
    })
  );
  return {
    success: true,
    reply:
      "Live Owner Session is off. New visual inspections will use the read-only sandbox."
  };
};
CalBuddy.verifyOwnerSession = async function ({ force = false } = {}) {
  const session = await CalBuddy.getCurrentSession();
  const userId = String(session?.user?.id || "").trim();

  if (!session?.access_token || !userId) {
    CalBuddy.ownerSessionCache = null;
    return false;
  }

  const cached = CalBuddy.ownerSessionCache;

  if (
    !force &&
    cached?.userId === userId &&
    cached.expiresAt > Date.now()
  ) {
    return cached.isOwner === true;
  }

  if (CalBuddy.ownerSessionVerification?.userId === userId) {
    return await CalBuddy.ownerSessionVerification.promise;
  }

  const verificationPromise = (async () => {
    let isOwner = false;

    try {
      const response = await fetch("/api/ari-github-read", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        cache: "no-store"
      });

      const data = await response.json().catch(() => ({}));
      isOwner = response.ok && data?.isOwner === true;
    } catch (error) {
      console.warn("Owner verification unavailable:", error?.message || error);
    }

    CalBuddy.ownerSessionCache = {
      userId,
      isOwner,
      expiresAt: Date.now() + (isOwner ? 60_000 : 10_000)
    };

    return isOwner;
  })();

  CalBuddy.ownerSessionVerification = {
    userId,
    promise: verificationPromise
  };

  try {
    return await verificationPromise;
  } finally {
    if (CalBuddy.ownerSessionVerification?.promise === verificationPromise) {
      CalBuddy.ownerSessionVerification = null;
    }
  }
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
  const numericWeight = CalBuddy.safeNumber(weight, 0);

  if (numericWeight <= 0) {
    throw new Error("Valid weight is required.");
  }

  const entry = {
    // Keep "weight" for existing Ari callers; Supabase uses weight_lbs.
    weight: numericWeight,
    weight_lbs: numericWeight,
    notes: CalBuddy.cleanText(notes),
    log_date: CalBuddy.formatLocalDate(new Date()),
    created_at: new Date().toISOString()
  };

  localStorage.setItem("calbuddyCurrentWeight", String(numericWeight));
  localStorage.setItem("calbuddyLatestWeight", String(numericWeight));

  if (user && window.calbuddySupabase) {
    const { error } = await window.calbuddySupabase
      .from("weight_logs")
      .upsert(
        {
          user_id: user.id,
          weight_lbs: numericWeight,
          log_date: entry.log_date
        },
        { onConflict: "user_id,log_date" }
      );

    if (error) {
      throw new Error(error.message || "Could not save weight.");
    }
  }

  // updateProfile persists the current weight and refreshes the dashboard once.
  await CalBuddy.updateProfile({
    weight_lbs: numericWeight
  });

  return entry;
};
CalBuddy.getRecentWeights = async function (limit = 8) {
  const user = await CalBuddy.getCurrentUser();

  if (user && window.calbuddySupabase) {
    const { data, error } = await window.calbuddySupabase
      .from("weight_logs")
      .select("weight_lbs, log_date")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Could not load recent weights:", error);
      return [];
    }

    return (data || []).map((entry) => ({
      ...entry,
      weight: Number(entry.weight_lbs || 0)
    }));
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
- If the user asks what to eat or asks for meal-planning advice, answer conversationally using their nutrition context. Do not create, save, schedule, or imply a Meal Plan application feature.
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
  const ownerVerificationPromise = user
    ? CalBuddy.verifyOwnerSession()
    : Promise.resolve(false);
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
  const ownerVerified = await ownerVerificationPromise;
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
    ownerVerified,
    profile
  };
context.ownerMode = CalBuddy.isOwner(context);
context.ariPermissions = CalBuddy.getAriPermissions(context);
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
  }, { authenticated: true });
};
CalBuddy.getMemories = async function () {
  const user = await CalBuddy.requireUser();
  return await CalBuddy.api("/api/memory", {
    action: "get_memories",
    user_id: user.id
  }, { authenticated: true });
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
  CalBuddy.pendingAction = action || null;
  if (action) localStorage.setItem("calbuddyPendingAction", JSON.stringify(action));
  else localStorage.removeItem("calbuddyPendingAction");
  window.dispatchEvent(new CustomEvent("calbuddy:pendingAction", { detail: { action: action || null } }));
  return action || null;
};

CalBuddy.getPendingAction = function () {
  if (CalBuddy.pendingAction) {
    if (CalBuddy.pendingAction?.vnext_action_id && CalBuddy.pendingAction?._ledger_persisted !== true) {
      CalBuddy.clearPendingAction();
      return null;
    }
    return CalBuddy.pendingAction;
  }

  const saved = localStorage.getItem("calbuddyPendingAction");
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved);
    // Pre-transaction vNext confirmations were browser-only and cannot be
    // trusted after this upgrade. Leave completed domain records alone, but
    // require any unfinished vNext mutation to be prepared again.
    if (parsed?.vnext_action_id && parsed?._ledger_persisted !== true) {
      localStorage.removeItem("calbuddyPendingAction");
      return null;
    }
    CalBuddy.pendingAction = parsed;
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

CalBuddy.pendingActionMatches = function (left = null, right = null) {
  if (!left || !right) return false;
  const ids = (action) => {
    const values = [
      action?.id,
      action?.vnext_action_id,
      action?.vnextActionId,
      action?.vnext_pending_action?.id,
      action?.vnextPendingAction?.id
    ];
    if (
      action?.name &&
      action?.sourceTurnId &&
      !action?.action_type &&
      action?.id
    ) {
      values.push(action.id);
    }
    return new Set(values.map((value) => String(value || "").trim()).filter(Boolean));
  };
  const leftIds = ids(left);
  const rightIds = ids(right);
  for (const id of leftIds) {
    if (rightIds.has(id)) return true;
  }
  return false;
};

CalBuddy.clearPendingActionStateFor = function (action = null) {
  if (!action) return false;
  let cleared = false;
  const current = CalBuddy.getPendingAction?.() || null;
  if (current && CalBuddy.pendingActionMatches(current, action)) {
    CalBuddy.clearPendingAction();
    cleared = true;
  }

  const bridgePending = window.AriVNextBridge?.getPendingAction?.() || null;
  if (
    bridgePending &&
    CalBuddy.pendingActionMatches(bridgePending, action) &&
    typeof window.AriVNextBridge?.clearPendingAction === "function"
  ) {
    window.AriVNextBridge.clearPendingAction();
    cleared = true;
  }

  return cleared;
};

CalBuddy.reconcilePendingActionWithLedger = async function (
  action = CalBuddy.getPendingAction?.() || window.AriVNextBridge?.getPendingAction?.() || null
) {
  if (!action) return null;

  const user = await CalBuddy.getCurrentUser();
  const client = window.calbuddySupabase || CalBuddy.supabase;
  if (!user?.id || !client) return action;

  const explicitVNextId = String(
    action?.vnext_action_id ||
    action?.vnextActionId ||
    action?.vnext_pending_action?.id ||
    action?.vnextPendingAction?.id ||
    ""
  ).trim();
  const bridgeStyleVNextId =
    !explicitVNextId &&
    action?.name &&
    action?.sourceTurnId &&
    !action?.action_type
      ? String(action?.id || "").trim()
      : "";
  const vnextActionId = explicitVNextId || bridgeStyleVNextId;
  const ledgerId =
    !vnextActionId && action?.action_type
      ? String(action?.id || "").trim()
      : "";

  if (!vnextActionId && !ledgerId) return action;

  let query = client
    .from("ai_app_actions")
    .select("*")
    .eq("user_id", user.id);

  query = vnextActionId
    ? query.eq("vnext_action_id", vnextActionId)
    : query.eq("id", ledgerId);

  const { data: row, error } = await query.maybeSingle();
  if (error) {
    console.warn("Ari pending action reconciliation failed:", error.message);
    return action;
  }

  // A durable vNext confirmation without a ledger row is not executable.
  if (!row?.id) {
    CalBuddy.clearPendingActionStateFor(action);
    return null;
  }

  const status = String(row.status || "").toLowerCase();
  if (["completed", "cancelled", "expired", "executing"].includes(status)) {
    CalBuddy.clearPendingActionStateFor(row);
    CalBuddy.clearPendingActionStateFor(action);
    return null;
  }

  const expiresAt = Date.parse(String(row.expires_at || row?.vnext_pending_action?.expiresAt || ""));
  if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
    void client
      .from("ai_app_actions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("user_id", user.id)
      .in("status", ["proposed", "pending", "failed"]);
    CalBuddy.clearPendingActionStateFor(row);
    CalBuddy.clearPendingActionStateFor(action);
    return null;
  }

  if (
    row.vnext_pending_action &&
    window.AriVNextBridge?.setPendingAction &&
    !CalBuddy.pendingActionMatches(window.AriVNextBridge?.getPendingAction?.(), row.vnext_pending_action)
  ) {
    window.AriVNextBridge.setPendingAction(row.vnext_pending_action);
  }

  if (
    row.status === "proposed" &&
    row.vnext_pending_action &&
    window.AriVNextActionAdapter?.createCalBuddyPendingAction
  ) {
    const materialized = await window.AriVNextActionAdapter.createCalBuddyPendingAction(row.vnext_pending_action);
    if (materialized?.alreadyCompleted) {
      CalBuddy.clearPendingActionStateFor(row);
      return null;
    }
    return materialized?.success ? materialized.action : null;
  }

  if (row.status === "pending" || row.status === "failed") {
    const current = CalBuddy.getPendingAction?.() || null;
    if (
      current &&
      CalBuddy.pendingActionMatches(current, row) &&
      String(current.status || "") === String(row.status || "")
    ) {
      return current;
    }
    return CalBuddy.setPendingAction({ ...row, _ledger_persisted: true });
  }

  return null;
};

CalBuddy.isDurableAction = function (action = null) {
  return Boolean(action?.id && (action?.vnext_action_id || action?.source_turn_id || action?.user_id));
};

CalBuddy.createGithubEditPendingAction = async function (
  developerIntent = {},
  { sourceTurnId = null } = {}
) {
  const githubEdit = developerIntent?.githubEdit || {};
  const filePath = String(githubEdit?.filePath || "").trim();
  const operation = githubEdit?.operation || "replace";

  if (!filePath) return null;

  if (
    operation === "replace" &&
    (!githubEdit?.find || githubEdit?.replace === undefined || githubEdit?.replace === null)
  ) {
    return null;
  }

  if (
    operation === "full_replace" &&
    (typeof githubEdit?.newContent !== "string" || !githubEdit.newContent.trim())
  ) {
    return null;
  }

  if (!["replace", "full_replace"].includes(operation)) return null;

  return await CalBuddy.createPendingAction({
    action_type: "github_edit_request",
    payload: {
      githubEdit: {
        mode: "commit",
        filePath,
        operation,
        find: githubEdit.find,
        replace: githubEdit.replace,
        newContent: githubEdit.newContent,
        replaceAll: githubEdit.replaceAll === true
      },
      title: developerIntent?.title || `Ari code update: ${filePath}`,
      summary: developerIntent?.summary || "Apply Ari's validated code patch.",
      developerIntentSource: developerIntent?.source || null
    },
    confirmation_text:
      `Apply Ari's proposed code change to ${filePath} and commit it to the configured GitHub branch?`,
    source_turn_id: sourceTurnId
  });
};

CalBuddy.createPendingAction = async function ({
  action_type,
  payload,
  confirmation_text = null,
  source_turn_id = null,
  vnext_action_id = null,
  vnext_pending_action = null,
  expires_at = null
}) {
  const user = await CalBuddy.getCurrentUser();
  const client = window.calbuddySupabase || CalBuddy.supabase;
  const now = new Date().toISOString();
  const action = {
    action_type,
    status: "pending",
    payload: payload || {},
    confirmation_text,
    source_turn_id,
    vnext_action_id,
    vnext_pending_action,
    expires_at,
    updated_at: now
  };

  // vNext proposals must have a durable server-created ledger row. Never fall
  // back to an ephemeral browser-only confirmation for a vNext mutation.
  if (vnext_action_id) {
    if (!user?.id || !client) {
      return { ...action, _ledger_persisted: false, _ledger_error: "action_ledger_unavailable" };
    }

    const { data: existing, error: lookupError } = await client
      .from("ai_app_actions")
      .select("*")
      .eq("user_id", user.id)
      .eq("vnext_action_id", vnext_action_id)
      .maybeSingle();

    if (lookupError || !existing?.id) {
      return {
        ...action,
        _ledger_persisted: false,
        _ledger_error: lookupError?.message || "durable_action_proposal_missing"
      };
    }

    if (existing.status === "completed") {
      return { ...existing, _ledger_persisted: true, _ledger_already_completed: true };
    }
    if (["cancelled", "expired"].includes(String(existing.status || ""))) {
      return {
        ...existing,
        _ledger_persisted: false,
        _ledger_error: `action_${existing.status}`
      };
    }

    const { data, error } = await client
      .from("ai_app_actions")
      .update({
        action_type,
        status: "pending",
        payload: payload || {},
        confirmation_text,
        source_turn_id: source_turn_id || existing.source_turn_id,
        vnext_pending_action: vnext_pending_action || existing.vnext_pending_action,
        expires_at: expires_at || existing.expires_at,
        error_code: null,
        error_message: null,
        failed_at: null,
        updated_at: now
      })
      .eq("id", existing.id)
      .eq("user_id", user.id)
      .in("status", ["proposed", "pending", "failed"])
      .select()
      .single();

    if (error || !data?.id) {
      return {
        ...existing,
        ...action,
        _ledger_persisted: false,
        _ledger_error: error?.message || "action_ledger_materialization_failed"
      };
    }

    const stored = { ...data, _ledger_persisted: true };
    CalBuddy.setPendingAction(stored);
    return stored;
  }

  // Legacy actions remain backward-compatible. New vNext actions never use this
  // browser-only fallback.
  const localAction = {
    ...action,
    created_at: now
  };
  CalBuddy.setPendingAction(localAction);

  if (user?.id && client) {
    const { data, error } = await client
      .from("ai_app_actions")
      .insert({ user_id: user.id, ...localAction })
      .select()
      .single();
    if (!error && data) {
      const stored = { ...data, _ledger_persisted: true };
      CalBuddy.setPendingAction(stored);
      return stored;
    }
  }

  return { ...localAction, _ledger_persisted: false };
};

CalBuddy.restorePendingActionFromLedger = async function ({ sourceTurnId = null } = {}) {
  const user = await CalBuddy.getCurrentUser();
  const client = window.calbuddySupabase || CalBuddy.supabase;
  if (!user?.id || !client) return null;

  let query = client
    .from("ai_app_actions")
    .select("*")
    .eq("user_id", user.id)
    .in("status", ["proposed", "pending", "failed"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (sourceTurnId) query = query.eq("source_turn_id", String(sourceTurnId));

  const { data, error } = await query;
  if (error) {
    console.warn("Ari action ledger recovery failed:", error.message);
    return null;
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.id) return null;

  const expiresAt = Date.parse(String(row.expires_at || row?.vnext_pending_action?.expiresAt || ""));
  if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) {
    void client
      .from("ai_app_actions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", row.id)
      .eq("user_id", user.id)
      .in("status", ["proposed", "pending", "failed"]);
    return null;
  }

  if (row.vnext_pending_action && window.AriVNextBridge?.setPendingAction) {
    window.AriVNextBridge.setPendingAction(row.vnext_pending_action);
  }

  const needsMaterialization =
    row.status === "proposed" ||
    (
      row.status === "failed" &&
      row.vnext_pending_action &&
      (!row.confirmation_text || !row.payload || Object.keys(row.payload).length === 0)
    );

  if (needsMaterialization && row.vnext_pending_action && window.AriVNextActionAdapter?.createCalBuddyPendingAction) {
    const materialized = await window.AriVNextActionAdapter.createCalBuddyPendingAction(row.vnext_pending_action);
    return materialized?.success ? materialized.action : null;
  }

  if (row.status === "pending" || row.status === "failed") {
    return CalBuddy.setPendingAction({ ...row, _ledger_persisted: true });
  }

  return null;
};

CalBuddy.markVNextActionFailed = async function (pending = {}, failure = {}) {
  const user = await CalBuddy.getCurrentUser();
  const client = window.calbuddySupabase || CalBuddy.supabase;
  const actionId = String(pending?.id || "").trim();
  if (!user?.id || !client || !actionId) return { success: false };

  const now = new Date().toISOString();
  const code = String(failure?.code || "action_mapping_failed").slice(0, 160);
  const message = String(failure?.message || "Ari could not safely prepare this action.").slice(0, 1200);
  const { data, error } = await client
    .from("ai_app_actions")
    .update({
      status: "failed",
      error_code: code,
      error_message: message,
      failed_at: now,
      updated_at: now
    })
    .eq("user_id", user.id)
    .eq("vnext_action_id", actionId)
    .in("status", ["proposed", "pending", "failed"])
    .select()
    .maybeSingle();

  return { success: !error && Boolean(data?.id), action: data || null };
};

CalBuddy.beginPendingActionExecution = async function (action = CalBuddy.getPendingAction()) {
  if (!CalBuddy.isDurableAction(action)) {
    return { success: true, durable: false, action };
  }

  const user = await CalBuddy.getCurrentUser();
  const client = window.calbuddySupabase || CalBuddy.supabase;
  if (!user?.id || !client || !action?.id) {
    return { success: false, code: "action_ledger_unavailable", message: "The pending action could not be verified." };
  }

  if (action.status === "completed") {
    return { success: true, durable: true, alreadyCompleted: true, action, result: action.result || {} };
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from("ai_app_actions")
    .update({
      status: "executing",
      confirmed_at: action.confirmed_at || now,
      execution_started_at: now,
      attempt_count: Math.max(0, Number(action.attempt_count || 0)) + 1,
      error_code: null,
      error_message: null,
      updated_at: now
    })
    .eq("id", action.id)
    .eq("user_id", user.id)
    .in("status", ["pending", "failed"])
    .select()
    .maybeSingle();

  if (!error && data?.id) {
    CalBuddy.setPendingAction({ ...data, _ledger_persisted: true });
    return { success: true, durable: true, action: data };
  }

  const { data: current } = await client
    .from("ai_app_actions")
    .select("*")
    .eq("id", action.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (current?.status === "completed") {
    return {
      success: true,
      durable: true,
      alreadyCompleted: true,
      action: current,
      result: current.result || {}
    };
  }

  return {
    success: false,
    durable: true,
    code: current?.status === "executing" ? "action_already_executing" : "action_execution_claim_failed",
    message: current?.status === "executing"
      ? "That action is already being completed."
      : error?.message || "The pending action could not be claimed safely."
  };
};

CalBuddy.completePendingAction = async function (action, result = {}, { confirmationTurnId = null } = {}) {
  if (!CalBuddy.isDurableAction(action)) return { success: true, durable: false, action };

  const user = await CalBuddy.getCurrentUser();
  const client = window.calbuddySupabase || CalBuddy.supabase;
  if (!user?.id || !client || !action?.id) return { success: false, code: "action_ledger_unavailable" };

  let safeResult = {};
  try {
    safeResult = JSON.parse(JSON.stringify(result || {}));
  } catch {
    safeResult = { reply: String(result?.reply || "Completed.").slice(0, 1000) };
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from("ai_app_actions")
    .update({
      status: "completed",
      result: safeResult,
      completed_at: now,
      confirmation_turn_id: confirmationTurnId || null,
      error_code: null,
      error_message: null,
      updated_at: now
    })
    .eq("id", action.id)
    .eq("user_id", user.id)
    .eq("status", "executing")
    .select()
    .maybeSingle();

  if (error || !data?.id) {
    return {
      success: false,
      durable: true,
      code: "action_receipt_write_failed",
      message: "The app change may have completed, but Ari could not verify its completion receipt. Refresh before trying again."
    };
  }

  // Completion is terminal for this exact proposal. Retire only matching browser
  // copies so a later log request with a fresh vNext action id remains independent.
  CalBuddy.clearPendingActionStateFor(data);
  window.dispatchEvent(new CustomEvent("calbuddy:actionCompleted", { detail: { action: data } }));

  return { success: true, durable: true, action: data, result: data.result || safeResult };
};

CalBuddy.failPendingAction = async function (action, failure = {}) {
  if (!CalBuddy.isDurableAction(action)) return { success: false, durable: false };

  const user = await CalBuddy.getCurrentUser();
  const client = window.calbuddySupabase || CalBuddy.supabase;
  if (!user?.id || !client || !action?.id) return { success: false, durable: true };

  const code = String(failure?.code || failure?.error || "action_execution_failed").slice(0, 160);
  const message = String(failure?.message || failure?.reply || failure?.result?.message || "The action could not be completed.").slice(0, 1200);
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("ai_app_actions")
    .update({
      status: "failed",
      error_code: code,
      error_message: message,
      failed_at: now,
      updated_at: now
    })
    .eq("id", action.id)
    .eq("user_id", user.id)
    .in("status", ["proposed", "pending", "executing", "failed"])
    .select()
    .maybeSingle();

  if (!error && data?.id) CalBuddy.setPendingAction({ ...data, _ledger_persisted: true });
  return { success: !error && Boolean(data?.id), durable: true, action: data || action };
};

CalBuddy.executeAction = async function (action) {
  const type = action.action_type || action.type;
  const payload = action.payload || {};
  if (type === "log_meal") return await CalBuddy.logMeal(payload);
  if (type === "log_weight") return await CalBuddy.logWeight(payload);
  if (type === "log_calories_burned") return await CalBuddy.logCaloriesBurned(payload);
  if (type === "change_reset_time") return await CalBuddy.changeResetTime(payload);
  if (type === "update_profile" || type === "update_goal_profile") return await CalBuddy.updateProfile(payload);
  if (type === "enable_visual_live_owner_session") {
    return await CalBuddy.enableVisualLiveOwnerSession({
      durationMinutes: payload.durationMinutes || 45
    });
  }
  if (type === "github_edit_request") {
    const context = await CalBuddy.getUserContext();

    if (context.ownerMode !== true) {
      return {
        success: false,
        code: "OWNER_ACCESS_DENIED",
        reply: "GitHub code changes require verified Owner Mode."
      };
    }

    const githubEdit = payload.githubEdit || action.githubEdit || payload;
    const filePath = String(githubEdit?.filePath || "").trim();
    const operation = githubEdit?.operation || "replace";

    if (!filePath) {
      return {
        success: false,
        code: "MISSING_FILE_PATH",
        reply: "I cannot apply that code change because the validated file path is missing."
      };
    }

    if (
      operation === "replace" &&
      (!githubEdit?.find || githubEdit?.replace === undefined || githubEdit?.replace === null)
    ) {
      return {
        success: false,
        code: "MISSING_FIND_REPLACE",
        reply: "I cannot apply that code change because the validated exact find/replace patch is incomplete."
      };
    }

    if (
      operation === "full_replace" &&
      (typeof githubEdit?.newContent !== "string" || !githubEdit.newContent.trim())
    ) {
      return {
        success: false,
        code: "MISSING_NEW_CONTENT",
        reply: "I cannot apply that code change because the validated replacement content is missing."
      };
    }

    if (!["replace", "full_replace"].includes(operation)) {
      return {
        success: false,
        code: "UNSUPPORTED_GITHUB_EDIT_OPERATION",
        reply: "I cannot apply that code change because its edit operation is not supported."
      };
    }

    const result = await CalBuddy.sendGithubEditRequest({
      mode: "commit",
      filePath,
      operation,
      find: githubEdit.find,
      replace: githubEdit.replace,
      newContent: githubEdit.newContent,
      replaceAll: githubEdit.replaceAll === true,
      autonomousDevelopment: githubEdit.autonomousDevelopment === true,
      commitMessage:
        githubEdit.commitMessage ||
        payload.title ||
        action.title ||
        `Ari owner-authorized update ${filePath}`,
      confirmationText: "CONFIRM GITHUB EDIT"
    });

    if (!result?.success) {
      return {
        success: false,
        code: result?.code || "GITHUB_EDIT_FAILED",
        result,
        reply: result?.error || "The owner-authorized GitHub edit did not complete."
      };
    }

    localStorage.removeItem("calbuddyPendingGithubEdit");
    localStorage.setItem("calbuddyLastGithubEditResult", JSON.stringify(result));

    return {
      success: true,
      result,
      reply:
        result?.message ||
        `GitHub commit created for ${filePath} after owner confirmation.`
    };
  }
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

  const claim = await CalBuddy.beginPendingActionExecution(action);
  if (!claim?.success) {
    CalBuddy.setAriMood("concerned");
    return {
      success: false,
      code: claim?.code || "action_execution_claim_failed",
      reply: claim?.message || "I couldn't safely confirm that action."
    };
  }

  if (claim.alreadyCompleted) {
    CalBuddy.clearPendingAction();
    CalBuddy.setAriMood("success");
    return {
      success: true,
      alreadyCompleted: true,
      result: claim.result || {},
      reply: claim.result?.reply || "That change was already saved."
    };
  }

  const executingAction = claim.action || action;
  try {
    const result = await CalBuddy.executeAction(executingAction);
    if (result?.success === false) {
      await CalBuddy.failPendingAction(executingAction, result);
      CalBuddy.setAriMood("concerned");
      return {
        success: false,
        result,
        reply: result?.message || result?.reply || "I couldn't confirm that change was saved."
      };
    }

    const receipt = await CalBuddy.completePendingAction(executingAction, result);
    if (!receipt?.success) {
      CalBuddy.setAriMood("concerned");
      return {
        success: false,
        result,
        code: receipt?.code || "action_receipt_write_failed",
        reply: receipt?.message || "The change may have completed, but Ari could not verify it."
      };
    }

    CalBuddy.clearPendingAction();
    CalBuddy.setAriMood("success");
    return {
      success: true,
      result,
      receipt: receipt.action || null,
      reply: result?.reply || "Done — I updated that for you."
    };
  } catch (error) {
    await CalBuddy.failPendingAction(executingAction, {
      code: "action_executor_exception",
      message: error?.message || "Action execution failed."
    });
    CalBuddy.setAriMood("concerned");
    return {
      success: false,
      error: error.message,
      reply: "I tried to do that, but the save did not complete."
    };
  }
};

CalBuddy.cancelPendingAction = function () {
  const action = CalBuddy.getPendingAction();

  if ((action?.action_type || action?.type) === "github_edit_request") {
    localStorage.removeItem("calbuddyPendingGithubEdit");
  }

  if (action) CalBuddy.clearPendingActionStateFor(action);
  else CalBuddy.clearPendingAction();

  if (CalBuddy.isDurableAction(action)) {
    Promise.resolve().then(async () => {
      const user = await CalBuddy.getCurrentUser();
      const client = window.calbuddySupabase || CalBuddy.supabase;
      if (!user?.id || !client || !action?.id) return;
      const now = new Date().toISOString();
      await client
        .from("ai_app_actions")
        .update({ status: "cancelled", cancelled_at: now, updated_at: now })
        .eq("id", action.id)
        .eq("user_id", user.id)
        .in("status", ["proposed", "pending", "failed"]);
    }).catch(() => {});
  }

  CalBuddy.setAriMood("idle");
  return {
    success: true,
    reply: "No problem — I won’t change that."
  };
};

CalBuddy.isLiveOwnerEnableCommand = function (message = "") {
  const text = String(message || "").toLowerCase().trim();
  return (
    /\b(turn on|enable|start|activate|switch to|use)\b.*\b(live owner|live owner session|live visual)\b/i.test(text) ||
    /\b(live owner|live owner session)\b.*\b(on|enable|start|activate)\b/i.test(text)
  );
};

CalBuddy.isLiveOwnerDisableCommand = function (message = "") {
  const text = String(message || "").toLowerCase().trim();
  return (
    /\b(turn off|disable|stop|disconnect|end)\b.*\b(live owner|live owner session|live visual)\b/i.test(text) ||
    /\b(live owner|live owner session)\b.*\b(off|disable|stop|disconnect|end)\b/i.test(text)
  );
};

CalBuddy.getRecentVisualInspection = function ({
  maxAgeMs = 30 * 60 * 1000
} = {}) {
  const saved = localStorage.getItem("calbuddyLastVisualInspection");
  if (!saved) return null;

  try {
    const value = JSON.parse(saved);
    const completedAtMs = Date.parse(String(value?.completedAt || ""));
    if (
      !value?.requestId ||
      !Number.isFinite(completedAtMs) ||
      Date.now() - completedAtMs > Math.max(60_000, Number(maxAgeMs) || 0)
    ) {
      localStorage.removeItem("calbuddyLastVisualInspection");
      return null;
    }

    if (!value?.visualAnalysis && !value?.evidence) return null;
    return value;
  } catch {
    localStorage.removeItem("calbuddyLastVisualInspection");
    return null;
  }
};

CalBuddy.isWholeAppVisualInspection = function (message = "") {
  const text = String(message || "").toLowerCase();
  return /\b(entire app|whole app|full app|all (?:the )?(?:app )?pages|navigate (?:the )?(?:entire |whole |full )?app|look through (?:the )?(?:entire |whole |full )?app|tour (?:the )?app)\b/i.test(text);
};

CalBuddy.isVisualInspectionFollowUp = function (message = "") {
  if (!CalBuddy.getRecentVisualInspection()) return false;
  const text = String(message || "").toLowerCase().trim();
  if (!text) return false;

  return (
    /\b(specific )?examples?\b/i.test(text) ||
    /\bwhat did you (?:see|notice|find|think)\b/i.test(text) ||
    /\bwhat (?:issues|problems|bugs|defects)\b/i.test(text) ||
    /\banything else\b/i.test(text) ||
    /\b(?:based on|from) what you (?:saw|noticed|found)\b/i.test(text) ||
    /\b(?:the|that) (?:visual )?inspection\b/i.test(text) ||
    /\b(?:those|these) (?:issues|problems|bugs|screens|screenshots?)\b/i.test(text) ||
    /\b(?:fix|explain|show|describe|tell me more about) (?:that|those|it|them)\b/i.test(text) ||
    /\bthe screenshots?\b/i.test(text)
  );
};

CalBuddy.isVisualEvidenceExplanationRequest = function (message = "") {
  if (!CalBuddy.isVisualInspectionFollowUp(message)) return false;
  const text = String(message || "").toLowerCase().trim();
  if (!text) return false;

  // Requests to change the app still need the developer workflow. Pure questions
  // about what ARI just saw should be answered directly from stored evidence.
  const mutationIntent =
    /\b(fix|change|update|edit|patch|remove|replace|implement|make it|do it|correct|redesign|adjust)\b/i.test(text);

  return !mutationIntent;
};

CalBuddy.buildVisualEvidenceFollowUpReply = function (
  inspection = null,
  message = ""
) {
  const analysis = inspection?.visualAnalysis || {};
  const evidence = inspection?.evidence || {};
  const findings = Array.isArray(analysis?.findings)
    ? analysis.findings.map(item => String(item || "").trim()).filter(Boolean)
    : [];

  const structural = [];
  for (const capture of Array.isArray(evidence?.captures) ? evidence.captures : []) {
    const route = String(capture?.url || capture?.checkpoint || "screen")
      .replace(/^https?:\/\/[^/]+/i, "") || "screen";
    const metrics = capture?.metrics || {};

    if (metrics.horizontalOverflow === true) {
      structural.push(
        `${route}: horizontal overflow of about ${Number(metrics.overflowPixels || 0)} px.`
      );
    }

    const offscreenCount = Array.isArray(metrics.offscreen)
      ? metrics.offscreen.length
      : 0;
    if (offscreenCount > 0) {
      structural.push(
        `${route}: ${offscreenCount} measured element${offscreenCount === 1 ? "" : "s"} extended outside the viewport.`
      );
    }

    const fixedWidthCount = Array.isArray(metrics.fixedWidthSuspects)
      ? metrics.fixedWidthSuspects.length
      : 0;
    if (fixedWidthCount > 0) {
      structural.push(
        `${route}: ${fixedWidthCount} fixed/min-width element${fixedWidthCount === 1 ? "" : "s"} looked suspicious for that viewport.`
      );
    }

    const consoleErrors = Array.isArray(capture?.consoleErrors)
      ? capture.consoleErrors.filter(Boolean)
      : [];
    if (consoleErrors.length > 0) {
      structural.push(
        `${route}: browser console reported ${consoleErrors.length} error${consoleErrors.length === 1 ? "" : "s"}.`
      );
    }
  }

  const examples = [...findings, ...structural]
    .filter((value, index, array) => array.indexOf(value) === index)
    .slice(0, 8);

  const wantsExamples =
    /\b(examples?|specific|areas? of improvement|issues?|problems?|what did you (?:see|notice|find))\b/i.test(
      String(message || "")
    );

  const lines = [];
  const summary = String(analysis?.summary || "").trim();

  if (summary && !wantsExamples) {
    lines.push(summary);
  }

  if (examples.length > 0) {
    if (wantsExamples) lines.push("Specific examples from the visual inspection:");
    for (const item of examples) lines.push(`- ${item}`);
  } else if (summary) {
    lines.push(summary);
    lines.push(
      "The stored inspection did not contain more specific route-level findings than that summary."
    );
  } else {
    lines.push(
      "I still have the completed visual inspection, but it did not preserve enough interpreted findings to give you specific examples from that run."
    );
  }

  const likelyCause = String(analysis?.likelyCause || "").trim();
  if (likelyCause && /\bwhy|cause|reason\b/i.test(String(message || ""))) {
    lines.push(`Likely cause: ${likelyCause}`);
  }

  const nextStep = String(analysis?.recommendedNextStep || "").trim();
  if (nextStep && /\bwhat should|next|improve|recommend\b/i.test(String(message || ""))) {
    lines.push(`Next step: ${nextStep}`);
  }

  return lines.join("\n");
};

CalBuddy.isExplicitVisualSandboxRequest = function (message = "") {
  const text = String(message || "").toLowerCase().trim();
  return (
    /\b(?:use|open|run|inspect in|look in|navigate in)\s+(?:the\s+)?(?:read[- ]only\s+)?sandbox\b/i.test(text) ||
    /\b(?:this is|that's|that is|treat this as)\s+(?:your\s+|the\s+)?sandbox\b/i.test(text) ||
    /\b(?:sandbox mode|visual sandbox|read[- ]only sandbox)\b/i.test(text)
  );
};

CalBuddy.messageRequiresLiveOwner = function (message = "") {
  if (CalBuddy.isExplicitVisualSandboxRequest(message)) return false;
  const text = String(message || "").toLowerCase();
  return (
    /\b(live owner|live owner session|my actual account|my real account|actual account state|real account state)\b/i.test(text) ||
    /\b(my|current|actual|real)\b.*\b(workout|meals?|circle|profile|messages?|meetup|goals?)\b/i.test(text)
  );
};

CalBuddy.isVisualInspectionCommand = function (message = "") {
  const text = String(message || "").toLowerCase().trim();

  const visualSignal =
    /\b(look at|look through|visually|visual inspect|inspect the app|inspect this|navigate|open the app|open this page|screenshot|see what|what .* look|looks? cut off|cut off|cropped|overflow|overlapping|zoomed|too crowded|layout|screen|ui)\b/i.test(text);

  const appSignal =
    /\b(app|ari xp|home|homepage|circle|training|workout|goals|meals|nutrition|progress|profile|owner|page|screen|menu|host|connect|feed|messages|meetup)\b/i.test(text) ||
    /\b[a-z0-9_-]+\.html\b/i.test(text);

  const explicitResume =
    /\b(check|resume|finish|status)\b.*\bvisual inspection\b/i.test(text);

  return (
    explicitResume ||
    CalBuddy.isVisualInspectionFollowUp(message) ||
    (visualSignal && appSignal)
  );
};

CalBuddy.inferVisualInspectionPath = function (message = "") {
  const text = String(message || "").toLowerCase();

  const explicit = text.match(/\b([a-z0-9_-]+\.html(?:\?[^\s]+)?)\b/i);
  if (explicit?.[1]) return `/${explicit[1].replace(/^\/+/, "")}`;

  if (/\b(messages?|dm|direct messages?)\b/.test(text) && /\bcircle\b/.test(text)) {
    return "/ari-circle-messages.html";
  }
  if (/\b(feed|post|posts)\b/.test(text) && /\bcircle\b/.test(text)) {
    return "/ari-circle.html";
  }
  if (/\b(meetup|host|jump in|connect)\b/.test(text) && /\bcircle\b/.test(text)) {
    return "/ari-circle-meetup.html";
  }
  if (/\bcircle\b/.test(text)) return "/ari-circle.html";
  if (/\b(training|workout|exercise)\b/.test(text)) return "/ari-training.html";
  if (/\b(meal|meals|nutrition|food)\b/.test(text)) return "/nutrition.html";
  if (/\b(progress)\b/.test(text)) return "/progress.html";
  if (/\b(goals?|calorie goal|weight goal)\b/.test(text)) return "/goals.html";
  if (/\b(owner|owner mode|intelligence controls)\b/.test(text)) return "/owner-ai-controls.html";
  if (/\b(profile)\b/.test(text)) return "/profile.html";

  return "/home.html";
};

CalBuddy.inferVisualActions = function (message = "") {
  const raw = String(message || "").trim();
  const text = raw.toLowerCase();
  const actions = [];

  if (CalBuddy.isWholeAppVisualInspection(message)) {
    for (const path of [
      "/goals.html",
      "/nutrition.html",
      "/ari-training.html",
      "/progress.html",
      "/ari-circle-meetup.html",
      "/ari-circle.html",
      "/profile.html",
      "/owner-ai-controls.html"
    ]) {
      actions.push({ type: "visit_path", path });
    }
    return actions;
  }

  if (/\b(open|show)\s+(?:the\s+)?menu\b/i.test(raw)) {
    actions.push({
      type: "click_role",
      role: "button",
      name: "Open ARI navigation"
    });
  }

  const quotedActionPattern =
    /\b(?:click|tap|press|select|open)\s+(?:the\s+)?(?:button\s+|link\s+|tab\s+)?["“']([^"”']{1,100})["”']/gi;

  let quotedMatch;
  while (
    actions.length < 6 &&
    (quotedMatch = quotedActionPattern.exec(raw))
  ) {
    const label = String(quotedMatch[1] || "").trim();
    if (!label || /^app$/i.test(label)) continue;
    actions.push({
      type: "click_text",
      text: label
    });
  }

  const namedButtonPattern =
    /\b(?:click|tap|press)\s+(?:the\s+)?([a-z0-9][a-z0-9 &+\-]{1,60}?)\s+(?:button|tab|link)\b/gi;

  let buttonMatch;
  while (
    actions.length < 6 &&
    (buttonMatch = namedButtonPattern.exec(raw))
  ) {
    const label = String(buttonMatch[1] || "").trim();
    if (!label) continue;
    actions.push({
      type: "click_text",
      text: label
    });
  }

  if (/\bscroll\s+down\b/i.test(text)) {
    actions.push({ type: "scroll", amount: 700 });
  } else if (/\bscroll\s+up\b/i.test(text)) {
    actions.push({ type: "scroll", amount: -700 });
  }

  return actions.slice(0, 8);
};

CalBuddy.inferVisualViewports = function (message = "") {
  const text = String(message || "").toLowerCase();
  const mobile = /\b(phone|iphone|mobile|393|390|430)\b/.test(text);
  const desktop = /\b(desktop|laptop|computer|1440|browser width)\b/.test(text);
  if (mobile && !desktop) return "mobile";
  if (desktop && !mobile) return "desktop";
  // Whole-app tours are intentionally bounded to one representative viewport
  // unless the owner explicitly names desktop/mobile. This keeps the visual
  // evidence package small enough to recover reliably from the worker.
  if (CalBuddy.isWholeAppVisualInspection(message)) return "mobile";
  return "both";
};

CalBuddy.isDeveloperCommand = function (message = "") {
  const text = String(message || "").toLowerCase().trim();

  const fileOrRepo =
    /\b(github|repo|repository|branch|commit|deploy|vercel|supabase)\b/.test(text) ||
    /\b(index\.html|style\.css|calbuddy-core\.js|ask-calbuddy|ari-github-read|ari-github-search|ari-github-edit)\b/.test(text) ||
    /\b[\w/-]+\.(js|html|css|json|md)\b/.test(text);

  const devVerb =
    /\b(read|open|show|search|find|update|change|replace|remove|fix|patch|commit|deploy|debug|edit)\b/.test(text);

  const ownerPhrases =
    text.includes("update this file") ||
    text.includes("update the file") ||
    text.includes("send full code") ||
    text.includes("send the full code") ||
    text.includes("read this file") ||
    text.includes("read the file") ||
    text.includes("search the repo") ||
    text.includes("search github") ||
    text.includes("commit this");

  return ownerPhrases || (fileOrRepo && devVerb);
};

CalBuddy.shouldHandleDeveloperIntent = function ({
  message = "",
  developerIntent = null,
  userContext = null
} = {}) {
  if (!developerIntent || developerIntent.enabled === false) return false;
  if (userContext?.ownerMode !== true) return false;

  const explicitDeveloperCommand = CalBuddy.isDeveloperCommand(message);

  const hasValidatedGithubEdit =
    developerIntent.type === "github_edit_request" &&
    Boolean(developerIntent.githubEdit?.filePath) &&
    (
      (
        (developerIntent.githubEdit?.operation || "replace") === "replace" &&
        Boolean(developerIntent.githubEdit?.find) &&
        developerIntent.githubEdit?.replace !== undefined &&
        developerIntent.githubEdit?.replace !== null
      ) ||
      (
        developerIntent.githubEdit?.operation === "full_replace" &&
        typeof developerIntent.githubEdit?.newContent === "string" &&
        Boolean(developerIntent.githubEdit.newContent.trim())
      )
    ) &&
    developerIntent.safety?.ownerRequired === true &&
    developerIntent.safety?.requiresConfirmation === true;

  if (hasValidatedGithubEdit) return true;

  const hasExecutableGithubWork =
    developerIntent.type === "github_read_request" ||
    developerIntent.type === "github_search_request" ||
    (Array.isArray(developerIntent.steps) &&
      developerIntent.steps.some(step =>
        step.tool === "github_read" ||
        step.tool === "github_search"
      ));

  return explicitDeveloperCommand && hasExecutableGithubWork;
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
CalBuddy.getConversationId = function () {
  const storageKey = "ari_conversation_id";
  let conversationId = sessionStorage.getItem(storageKey);

  if (!conversationId) {
    conversationId =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : "00000000-0000-4000-8000-" +
          Math.random().toString(16).slice(2).padEnd(12, "0").slice(0, 12);
    sessionStorage.setItem(storageKey, conversationId);
  }

  return conversationId;
};

CalBuddy.loadRecentConversationHistory = async function () {
  const client = window.calbuddySupabase || CalBuddy.supabase;
  const session = await CalBuddy.getCurrentSession();

  if (!client || !session?.user?.id) return [];

  try {
    const { data, error } = await client
      .from("ari_conversation_turns")
      .select("user_message,assistant_message,created_at")
      .eq("user_id", session.user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("Recent Ari continuity is not available:", error.message);
      return [];
    }

    return (Array.isArray(data) ? data.slice().reverse() : []).flatMap((turn) => [
      { role: "user", content: String(turn.user_message || "") },
      { role: "assistant", content: String(turn.assistant_message || "") }
    ]).filter((item) => item.content.trim());
  } catch (error) {
    console.warn("Recent Ari continuity load failed:", error);
    return [];
  }
};

CalBuddy.mergeConversationHistory = function (recent = [], current = []) {
  const merged = [];
  const seen = new Set();

  [...recent, ...(Array.isArray(current) ? current : [])].forEach((item) => {
    const role = item?.role === "assistant" ? "assistant" : "user";
    const content = String(item?.content || "").trim();
    if (!content) return;

    const key = `${role}:${content.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    merged.push({ role, content });
  });

  return merged.slice(-20);
};

CalBuddy.saveConversationTurn = async function ({ message, reply }) {
  const client = window.calbuddySupabase || CalBuddy.supabase;
  const session = await CalBuddy.getCurrentSession();
  const userMessage = String(message || "").trim();
  const assistantMessage = String(reply || "").trim();

  if (!client || !session?.user?.id || !userMessage || !assistantMessage) {
    return false;
  }

  try {
    const { error } = await client
      .from("ari_conversation_turns")
      .insert({
        user_id: session.user.id,
        conversation_id: CalBuddy.getConversationId(),
        user_message: userMessage,
        assistant_message: assistantMessage,
        page_path: window.location.pathname || "unknown"
      });

    if (error) {
      console.warn("Recent Ari continuity was not saved:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Recent Ari continuity save failed:", error);
    return false;
  }
};

CalBuddy._askAriInternal = async function ({ message, history = [], debugTiming = false, readOnlyFallback = false }) {
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

CalBuddy.exposeSupabaseToAri();

if (!message || !message.trim()) {
    throw new Error("Message is required.");
  }
  const pending = CalBuddy.getPendingAction();
  if (!readOnlyFallback && pending && CalBuddy.isYes(message)) {
    return await CalBuddy.confirmPendingAction();
  }
  if (!readOnlyFallback && pending && CalBuddy.isNo(message)) {
    return CalBuddy.cancelPendingAction();
  }

  // Backward compatibility only: old builds stored GitHub edits outside the
  // normal pending-action lifecycle. Never let a casual "yes" resurrect one.
  const pendingGithubEdit = localStorage.getItem("calbuddyPendingGithubEdit");
  const exactLegacyGithubConfirmation =
    String(message || "").trim().toUpperCase() === "CONFIRM GITHUB EDIT";

  if (
    !readOnlyFallback &&
    !pending &&
    pendingGithubEdit &&
    exactLegacyGithubConfirmation
  ) {
    return await CalBuddy.confirmPendingGithubEdit();
  }

  if (
    !readOnlyFallback &&
    !pending &&
    pendingGithubEdit &&
    CalBuddy.isNo(message)
  ) {
    localStorage.removeItem("calbuddyPendingGithubEdit");
  }
  // Fast path for questions about a just-completed visual inspection.
  // The expensive application-context/model pipeline is unnecessary here because
  // the browser + vision result is already verified and stored locally.
  if (
    !readOnlyFallback &&
    CalBuddy.isVisualEvidenceExplanationRequest(message)
  ) {
    const recentVisual = CalBuddy.getRecentVisualInspection();
    const ownerVerified = await CalBuddy.verifyOwnerSession();

    if (ownerVerified && recentVisual) {
      const reply = CalBuddy.buildVisualEvidenceFollowUpReply(
        recentVisual,
        message
      );

      if (reply) {
        finishTiming();
        return {
          reply,
          emotion: "thinking",
          pendingAction: null,
          memoryCandidate: null,
          developerIntent: null,
          visualInspection: {
            success: true,
            status: "completed",
            requestId: recentVisual.requestId,
            targetPath: recentVisual.targetPath || null,
            visualMode: recentVisual.visualMode || "sandbox",
            reusedVisualEvidence: true,
            visualAnalysis: recentVisual.visualAnalysis || null,
            evidence: recentVisual.evidence || null
          },
          source: "calbuddy_visual_evidence_followup"
        };
      }
    }
  }

  mark("before getUserContext");

const userContext =
  await CalBuddy.getUserContext();

mark("after getUserContext");

if (
  !readOnlyFallback &&
  userContext.ownerMode === true &&
  CalBuddy.isLiveOwnerDisableCommand(message)
) {
  finishTiming();
  return CalBuddy.disableVisualLiveOwnerSession();
}

if (
  !readOnlyFallback &&
  userContext.ownerMode === true &&
  CalBuddy.isLiveOwnerEnableCommand(message)
) {
  const liveAction = await CalBuddy.createPendingAction({
    action_type: "enable_visual_live_owner_session",
    payload: { durationMinutes: 45 },
    confirmation_text:
      "Enable Live Owner Session for up to 45 minutes so ARI can visually inspect your real authenticated ARI XP state? Browser-side production mutations will remain blocked."
  });
  CalBuddy.setAriMood("thinking");
  finishTiming();
  return {
    reply: liveAction.confirmation_text,
    pendingAction: liveAction,
    emotion: "thinking",
    liveOwnerSession: { active: false, awaitingConfirmation: true }
  };
}

/* -----------------------------
DETERMINISTIC OWNER VISUAL INSPECTION

Owner-only visual requests run through a read-only Playwright sandbox.
The returned screenshots are interpreted by the vision model, then handed
back to Ari Rebirth so visual evidence can drive repository investigation.
----------------------------- */

if (
  !readOnlyFallback &&
  userContext.ownerMode === true &&
  CalBuddy.isVisualInspectionCommand(message)
) {
  mark("before owner visual inspection");

  const pendingVisual = CalBuddy.getPendingVisualInspection();
  const recentVisual = CalBuddy.getRecentVisualInspection();
  const isVisualFollowUp = CalBuddy.isVisualInspectionFollowUp(message);
  const wantsResume =
    /\b(check|resume|finish|status)\b.*\bvisual inspection\b/i.test(
      String(message || "")
    );

  const targetPath =
    pendingVisual?.targetPath && wantsResume
      ? pendingVisual.targetPath
      : isVisualFollowUp && recentVisual?.targetPath
        ? recentVisual.targetPath
        : CalBuddy.inferVisualInspectionPath(message);

  const liveOwnerActive = await CalBuddy.isVisualLiveOwnerSessionActive();
  const explicitSandbox = CalBuddy.isExplicitVisualSandboxRequest(message);
  const requestedLiveOwner = CalBuddy.messageRequiresLiveOwner(message);

  if (requestedLiveOwner && !liveOwnerActive) {
    const liveAction = await CalBuddy.createPendingAction({
      action_type: "enable_visual_live_owner_session",
      payload: { durationMinutes: 45 },
      confirmation_text:
        "This inspection depends on your real ARI XP account state. Enable Live Owner Session for up to 45 minutes? Browser-side production mutations will remain blocked."
    });
    finishTiming();
    return {
      reply: liveAction.confirmation_text,
      pendingAction: liveAction,
      emotion: "thinking",
      liveOwnerSession: { active: false, awaitingConfirmation: true }
    };
  }

  const resolvedVisualMode =
    pendingVisual?.visualMode && wantsResume
      ? pendingVisual.visualMode
      : isVisualFollowUp && recentVisual?.visualMode
        ? recentVisual.visualMode
        : explicitSandbox
          ? "sandbox"
          : liveOwnerActive
            ? "live_owner"
            : "sandbox";

  const visualResult =
    isVisualFollowUp && recentVisual && !wantsResume
      ? {
          success: true,
          status: "completed",
          requestId: recentVisual.requestId,
          targetPath: recentVisual.targetPath || targetPath,
          visualMode: recentVisual.visualMode || resolvedVisualMode,
          visualAnalysis: recentVisual.visualAnalysis || null,
          evidence: recentVisual.evidence || null,
          reusedVisualEvidence: true,
          originalInstruction: recentVisual.instruction || null
        }
      : await CalBuddy.runVisualInspection({
          message:
            pendingVisual?.instruction && wantsResume
              ? pendingVisual.instruction
              : message,
          targetPath,
          viewports: CalBuddy.inferVisualViewports(message),
          actions:
            wantsResume
              ? []
              : CalBuddy.inferVisualActions(message),
          resumeRequestId:
            wantsResume
              ? pendingVisual?.requestId || null
              : null,
          visualMode: resolvedVisualMode
        });

  mark("after owner visual inspection");

  if (visualResult?.status === "in_progress") {
    finishTiming();
    return {
      reply:
        visualResult.message ||
        "The visual browser worker is still running. Ask me to check the visual inspection and I’ll resume the same run.",
      emotion: "thinking",
      pendingAction: null,
      memoryCandidate: null,
      developerIntent: null,
      visualInspection: visualResult
    };
  }

  if (!visualResult?.success) {
    finishTiming();
    return {
      reply:
        visualResult?.error ||
        visualResult?.message ||
        "I could not complete the visual inspection.",
      emotion: "concerned",
      pendingAction: null,
      memoryCandidate: null,
      developerIntent: null,
      visualInspection: visualResult
    };
  }

  const visualContext = {
    visualAnalysis: visualResult.visualAnalysis || null,
    evidence: visualResult.evidence || null
  };

  const visualPrompt = `OWNER VISUAL APP INSPECTION

Current owner request:
${message}

Original visual-inspection request:
${visualResult?.originalInstruction || recentVisual?.instruction || message}

A real browser worker navigated ARI XP and a vision model inspected the captured screenshot(s).
Evidence reused from the immediately prior completed inspection: ${visualResult?.reusedVisualEvidence === true ? "yes" : "no"}.
Visual mode: ${visualResult?.visualMode || resolvedVisualMode}.
If the mode is live_owner, the screenshots and reads came from the owner's real authenticated ARI XP state while browser-side production mutations were blocked. If the mode is sandbox, simulated owner data was used.

VISUAL EVIDENCE:
${JSON.stringify(visualContext, null, 2).slice(0, 18000)}

Use this as real visual/browser evidence.
- Do not say you cannot see or navigate the app.
- Do not claim code was changed merely because the screen was inspected.
- If the owner only asked to inspect/explain, answer directly from this evidence.
- If the owner asked to fix/change the UI, continue into the normal developer workflow: search/read the relevant repository code, then prepare an exact patch only when evidence supports it.
- Treat selectors, IDs, labels, overflow measurements, console errors, and searchHints above as investigation clues, not guessed code.`;

  const visualReasoner =
    window.AriVNextBridge && typeof window.AriVNextBridge.ask === "function"
      ? window.AriVNextBridge
      : window.AriRebirthAppBridge && typeof window.AriRebirthAppBridge.ask === "function"
        ? window.AriRebirthAppBridge
        : null;

  if (visualReasoner) {
    const findings = Array.isArray(visualResult?.visualAnalysis?.findings)
      ? visualResult.visualAnalysis.findings.slice(0, 8)
      : [];
    const visualExecutionEvidence = {
      observations: [
        ...(visualResult?.visualAnalysis?.summary
          ? [{
              id: visualResult.requestId || null,
              kind: "visual_inspection",
              summary: String(visualResult.visualAnalysis.summary).slice(0, 900),
              source: targetPath,
              verified: true
            }]
          : []),
        ...findings.map((finding, index) => ({
          id: visualResult.requestId ? `${visualResult.requestId}:finding:${index + 1}` : null,
          kind: "visual_observation",
          summary: String(finding || "").slice(0, 700),
          source: targetPath,
          verified: true
        }))
      ],
      artifacts: visualResult?.requestId
        ? [{
            id: visualResult.requestId,
            kind: "visual_inspection",
            label: `Visual Inspector ${targetPath}`,
            ref: visualResult.requestId,
            verified: true
          }]
        : []
    };

    const usingVNextVisualReasoner = visualReasoner === window.AriVNextBridge;
    const visualReasoning = await visualReasoner.ask(
      usingVNextVisualReasoner ? message : visualPrompt,
      {
        source: "calbuddy-core-visual-inspector",
        page: targetPath,
        history: history.slice(-10),
        userContext,
        ownerMode: true,
        ariPermissions: userContext.ariPermissions || {},
        visualInspection: visualContext,
        executionEvidence: visualExecutionEvidence
      }
    );

    const visualDeveloperIntent =
      visualReasoning?.developerIntent ||
      visualReasoning?.summary?.developerIntent ||
      null;

    if (
      CalBuddy.shouldHandleDeveloperIntent({
        message,
        developerIntent: visualDeveloperIntent,
        userContext
      })
    ) {
      const handledVisualDeveloperIntent =
        await CalBuddy.handleDeveloperIntent({
          developerIntent: visualDeveloperIntent,
          originalMessage: `${message}\n\nVISUAL INSPECTION:\n${JSON.stringify(visualContext).slice(0, 12000)}`,
          userContext,
          history
        });

      if (handledVisualDeveloperIntent) {
        finishTiming();
        return {
          ...handledVisualDeveloperIntent,
          visualInspection: visualResult,
          rebirthSummary: visualReasoning?.summary || null
        };
      }
    }

    finishTiming();
    return {
      ...visualReasoning,
      reply:
        visualReasoning?.reply ||
        visualResult?.visualAnalysis?.summary ||
        "I visually inspected the requested ARI XP screen.",
      emotion: visualReasoning?.emotion || "thinking",
      pendingAction: visualReasoning?.pendingAction || null,
      memoryCandidate: visualReasoning?.memoryCandidate || null,
      developerIntent: visualDeveloperIntent,
      visualInspection: visualResult,
      rebirthSummary: visualReasoning?.summary || null
    };
  }

  finishTiming();
  return {
    reply:
      visualResult?.visualAnalysis?.summary ||
      "I visually inspected the requested ARI XP screen.",
    emotion: "thinking",
    pendingAction: null,
    memoryCandidate: null,
    developerIntent: null,
    visualInspection: visualResult
  };
}

/* -----------------------------
DETERMINISTIC OWNER GITHUB ROUTING

Explicit GitHub read/search commands must be routed before
the conversational runtime. This prevents the language model
from incorrectly claiming that GitHub access is unavailable.
----------------------------- */

if (
  userContext.ownerMode === true &&
  CalBuddy.isDeveloperCommand(message)
) {
  const normalizedMessage =
    String(message || "").trim();

  const filePathMatch =
    normalizedMessage.match(
      /\b(?:read|open|show|inspect|analyze)\s+(?:the\s+)?(?:github\s+)?(?:file\s+)?([a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+)\b/i
    );

  if (filePathMatch?.[1]) {
    const filePath =
      filePathMatch[1]
        .replace(/[.,;:!?]+$/, "")
        .trim();

    mark("before deterministic GitHub read");

    const handledRead =
      await CalBuddy.handleDeveloperIntent({
        developerIntent: {
          enabled: true,
          type: "github_read_request",
          source:
            "deterministic_owner_command",

          filePath,

          githubRead: {
            filePath
          }
        },

        originalMessage:
          normalizedMessage,

        userContext,
        history
      });

    mark("after deterministic GitHub read");

    if (handledRead) {
      CalBuddy.setAriMood(
        handledRead.emotion ||
        "thinking"
      );

      finishTiming();

      return {
        ...handledRead,

        pendingAction:
          handledRead.pendingAction ||
          null,

        memoryCandidate:
          handledRead.memoryCandidate ||
          null
      };
    }
  }

  const searchMatch =
    normalizedMessage.match(
      /\b(?:search|find|look\s+for)\s+(?:(?:github|the\s+repo|the\s+repository)\s*)?(?:for\s+)?(.+)$/i
    );

  if (searchMatch?.[1]) {
    const query =
      searchMatch[1]
        .replace(/[?!]+$/, "")
        .trim();

    if (query) {
      mark("before deterministic GitHub search");

      const handledSearch =
        await CalBuddy.handleDeveloperIntent({
          developerIntent: {
            enabled: true,
            type:
              "github_search_request",
            source:
              "deterministic_owner_command",

            query,
            searchQuery:
              query,

            githubSearch: {
              query
            }
          },

          originalMessage:
            normalizedMessage,

          userContext,
          history
        });

      mark("after deterministic GitHub search");

      if (handledSearch) {
        CalBuddy.setAriMood(
          handledSearch.emotion ||
          "thinking"
        );

        finishTiming();

        return {
          ...handledSearch,

          pendingAction:
            handledSearch.pendingAction ||
            null,

          memoryCandidate:
            handledSearch.memoryCandidate ||
            null
        };
      }
    }
  }
}

let quickAction = null;
if (!readOnlyFallback) {
  mark("before detectAriActionFromMessage");
  quickAction = await CalBuddy.detectAriActionFromMessage(
    message,
    userContext
  );
  mark("after detectAriActionFromMessage");
}
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
  readOnlyFallback,

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

  if (readOnlyFallback) {
    const rawReply = String(rebirth?.reply || "").trim();
    const unsafeClaim =
      Array.isArray(rebirth?.actions) && rebirth.actions.length > 0 ||
      /\b(?:i(?:'ve| have)?\s+(?:logged|saved|added|recorded|updated|created|deleted|removed)|(?:it|that)\s+(?:is|'s)\s+(?:logged|saved|added|recorded|updated|created|deleted|removed)|done[.!]?$)\b/i.test(rawReply);
    return {
      ...rebirth,
      reply: unsafeClaim
        ? "I couldn't prepare that app change through the primary Ari runtime. Nothing was saved. Try again."
        : rawReply || "I couldn't complete that request through the primary Ari runtime. Try again.",
      pendingAction: null,
      action: null,
      actions: [],
      memoryCandidate: null,
      developerIntent: null,
      readOnlyFallback: true
    };
  }

  const mood = rebirth.emotion || "happy";
CalBuddy.setAriMood(mood);

CalBuddy.captureAriTemporarySuggestions({
  userMessage: message,
  reply: rebirth.reply || "",
  source: "rebirth"
});

  const developerIntent =
  rebirth.developerIntent ||
  rebirth.summary?.developerIntent ||
  null;

const shouldHandleDeveloperIntent = CalBuddy.shouldHandleDeveloperIntent({
  message,
  developerIntent,
  userContext
});

if (shouldHandleDeveloperIntent) {
    const handledIntent = await CalBuddy.handleDeveloperIntent({
      developerIntent,
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

  if (readOnlyFallback) {
    const rawReply = String(response?.reply || response?.text || response?.message || "").trim();
    const unsafeClaim =
      Boolean(response?.pendingAction) ||
      /\b(?:i(?:'ve| have)?\s+(?:logged|saved|added|recorded|updated|created|deleted|removed)|(?:it|that)\s+(?:is|'s)\s+(?:logged|saved|added|recorded|updated|created|deleted|removed)|done[.!]?$)\b/i.test(rawReply);
    return {
      ...response,
      reply: unsafeClaim
        ? "I couldn't prepare that app change through the primary Ari runtime. Nothing was saved. Try again."
        : rawReply || "I couldn't complete that request through the primary Ari runtime. Try again.",
      pendingAction: null,
      action: null,
      actions: [],
      memoryCandidate: null,
      developerIntent: null,
      readOnlyFallback: true
    };
  }

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

if (
  CalBuddy.shouldHandleDeveloperIntent({
    message,
    developerIntent: response.developerIntent,
    userContext
  })
) {
  localStorage.setItem(
    "calbuddyLastDeveloperIntent",
    JSON.stringify(response.developerIntent)
  );

  CalBuddy.saveDeveloperIntentLocally(response.developerIntent);

  if (response.developerIntent.githubEdit) {
    // New code edits use the normal pending-action lifecycle. Clear any stale
    // legacy GitHub-only proposal so there is exactly one confirmation source.
    localStorage.removeItem("calbuddyPendingGithubEdit");

    if (
      !response.pendingAction &&
      response.developerIntent.type === "github_edit_request"
    ) {
      const pendingGithubEdit = await CalBuddy.createGithubEditPendingAction(
        response.developerIntent,
        {
          sourceTurnId:
            response.turnId ||
            response.sourceTurnId ||
            response.source_turn_id ||
            null
        }
      );

      if (pendingGithubEdit) {
        response.pendingAction = pendingGithubEdit;
      }
    }
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
      const resultPaths = [
  ...new Set(
    (searchResult.results || [])
      .map(item => item.path)
      .filter(Boolean)
  )
];

const resultsText = resultPaths
  .map(path => `- ${path}`)
  .join("\n");

response.githubSearchResult = searchResult;

response.reply =
  resultPaths.length > 0
    ? `I found ${resultPaths.length} matching file(s) for "${query}":\n${resultsText}`
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

CalBuddy.askAri = async function (input = {}) {
  const recentHistory = await CalBuddy.loadRecentConversationHistory();
  const history = CalBuddy.mergeConversationHistory(
    recentHistory,
    input.history || []
  );

  const result = await CalBuddy._askAriInternal({
    ...input,
    history
  });

  const reply = String(
    result?.reply ||
    result?.text ||
    result?.message ||
    ""
  ).trim();

  if (reply) {
    void CalBuddy.saveConversationTurn({
      message: input.message,
      reply
    });
  }

  return result;
};

/* -----------------------------
ARI INTELLIGENCE FOUNDATION
Dynamic greetings, owner mode, simple patterns
----------------------------- */

CalBuddy.isOwner = function (context = {}) {
  return context.ownerVerified === true;
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

    const fileContent =
  String(
    readResult.content ||
    ""
  );

const analysisPrompt =
  `OWNER GITHUB FILE REQUEST

Original request:
${originalMessage}

File path:
${filePath}

The GitHub read already succeeded.

Analyze the exact file content below. Do not say that GitHub access is unavailable. Do not attempt to read the file again.

Return a clear explanation of:
- what the file does
- any important problems found
- the safest next step

FILE CONTENT START
${fileContent}
FILE CONTENT END`;

try {
  const analysisResponse =
    await window.AriRebirthAppBridge.ask(
      analysisPrompt,
      {
        source:
          "calbuddy-core-github-file-analysis",

        page:
          window.location.pathname ||
          "unknown",

        history:
          history.slice(-10),

        userContext:
          userContext ||
          await CalBuddy.getUserContext(),

        coachMemorySummary:
          userContext
            ?.coachMemorySummary ||
          "",

        ownerMode:
          true,

        ariPermissions:
          userContext
            ?.ariPermissions ||
          {},

        githubFileContext: {
          filePath,

          content:
            fileContent,

          contentLength:
            fileContent.length,

          contentComplete:
            readResult
              .contentComplete !==
            false,

          fullContent:
            readResult
              .fullContent ===
            true,

          isFullFile:
            readResult
              .isFullFile ===
            true,

          hasExactCurrentCode:
            true
        }
      }
    );

  const analysisSucceeded =
    analysisResponse &&
    analysisResponse.success !==
      false &&
    analysisResponse.ok !==
      false &&
    analysisResponse.deliveryStatus !==
      "failed" &&
    Boolean(
      String(
        analysisResponse.reply ||
        ""
      ).trim()
    );

  if (!analysisSucceeded) {
    console.error(
      "GITHUB FILE ANALYSIS FAILED:",
      analysisResponse
    );

    return {
      reply:
        `I successfully read ${filePath}, but Ari's analysis pipeline failed at ${
          analysisResponse
            ?.error
            ?.message ||
          analysisResponse
            ?.reply ||
          "an unknown reasoning stage"
        }.`,

      emotion:
        "concerned",

      developerIntent,

      githubReadResult:
        readResult,

      githubAnalysisFailed:
        true,

      githubAnalysisFailure:
        analysisResponse ||
        null
    };
  }

  return {
    reply:
      analysisResponse.reply,

    emotion:
      analysisResponse.emotion ||
      "thinking",

    developerIntent:
      analysisResponse.developerIntent ||
      developerIntent,

    githubReadResult:
      readResult,

    rebirthSummary:
      analysisResponse.summary ||
      null,

    githubAnalysisSucceeded:
      true
  };
} catch (error) {
  console.error(
    "GITHUB FILE ANALYSIS EXCEPTION:",
    error
  );

  return {
    reply:
      `I successfully read ${filePath}, but the file-analysis step failed: ${
        error?.message ||
        "unknown analysis error"
      }`,

    emotion:
      "concerned",

    developerIntent,

    githubReadResult:
      readResult,

    githubAnalysisFailed:
      true,

    githubAnalysisError: {
      message:
        error?.message ||
        String(error)
    }
  };
}
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

    const resultPaths = [
  ...new Set(
    (searchResult.results || [])
      .map(item => item.path)
      .filter(Boolean)
  )
];

const resultsText = resultPaths
  .map(path => `- ${path}`)
  .join("\n");

return {
  reply:
    resultPaths.length > 0
      ? `I found ${resultPaths.length} matching file(s) for "${query}":\n${resultsText}`
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
  .map(item => ({
    ...item,
    result: {
      ...item.result,
      content: item.result.content,
      contentLength:
        item.result.contentLength ||
        item.result.content?.length ||
        0,
      lineCount:
        item.result.lineCount ||
        String(item.result.content || "").split("\n").length,
      fullContent: item.result.fullContent === true,
      contentComplete: item.result.contentComplete !== false,
      isFullFile: item.result.isFullFile !== false,
      hasExactCurrentCode: true
    }
  }))
  .slice(0, 5);

  if (readableFiles.length > 0) {
    const combinedGithubContent = readableFiles
  .map(item => {
    return [
      `/* ===== FILE: ${item.filePath} ===== */`,
      item.result.content || ""
    ].join("\n");
  })
  .join("\n\n");

const combinedFilePath = readableFiles
  .map(item => item.filePath)
  .join(", ");

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
  filePath: combinedFilePath,
  content: combinedGithubContent,
  contentLength: combinedGithubContent.length,
  contentComplete: true,
  isFullFile: true,
  fullContent: true,
  files: readableFiles.map(item => ({
    filePath: item.filePath,
    contentLength: item.result.content?.length || 0,
    lineCount: item.result.lineCount || 0,
    contentComplete: item.result.contentComplete !== false,
    isFullFile: item.result.isFullFile !== false
  }))
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
      reply:
  analysisResponse.reply ||
  `I analyzed ${readableFiles.length} file(s): ${combinedFilePath}.`,
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

CalBuddy.searchGithubCode = async function (
  query,
  {
    searchPath = "",
    maxResults = 25,
    caseSensitive = false,
    extensions = []
  } = {}
) {
  try {
    const context =
      await CalBuddy.getUserContext();

    if (context.ownerMode !== true) {
      return {
        success: false,
        error: "Developer tools are only available in Owner Mode.",
        code: "OWNER_ACCESS_DENIED"
      };
    }

    const response =
      await fetch(
        "/api/ari-github-read",
        {
          method: "POST",

          headers:
            await CalBuddy.getOwnerRequestHeaders(),

          body: JSON.stringify({
            operation:
              "search_code",

            query,
            searchPath,
            maxResults,
            caseSensitive,
            extensions
          })
        }
      );

    const data =
      await response
        .json()
        .catch(() => ({}));

    console.log(
      "GitHub Search Response:",
      data
    );

    if (
      !response.ok ||
      data?.success !== true
    ) {
      return {
        success: false,

        error:
          data?.error ||
          "GitHub search failed.",

        code:
          data?.code ||
          "GITHUB_SEARCH_FAILED",

        status:
          response.status,

        raw:
          data
      };
    }

    const results =
      Array.isArray(data.matches)
        ? data.matches.map(
            match => ({
              ...match,

              // Compatibility with existing callers.
              path:
                match.filePath ||
                match.path ||
                null
            })
          )
        : [];

    return {
      ...data,

      count:
        Number(
          data.resultCount
        ) ||
        results.length,

      results
    };
  } catch (error) {
    console.error(
      "GitHub Search Error:",
      error
    );

    return {
      success: false,

      error:
        error?.message ||
        "GitHub search failed.",

      code:
        "GITHUB_SEARCH_REQUEST_FAILED"
    };
  }
};

CalBuddy.sendGithubEditRequest = async function (payload) {
  try {
    const safePayload = { ...(payload || {}) };
    delete safePayload.owner_access;

    const response = await fetch("/api/ari-github-edit", {
      method: "POST",
      headers: await CalBuddy.getOwnerRequestHeaders(),
      body: JSON.stringify(safePayload)
    });

    const data = await response.json().catch(() => ({}));

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
CalBuddy.readGithubFile = async function (
  filePath,
  {
    startLine = null,
    endLine = null
  } = {}
) {
  try {
    const context =
      await CalBuddy.getUserContext();

    if (context.ownerMode !== true) {
      return {
        success: false,
        error: "Developer tools are only available in Owner Mode.",
        code: "OWNER_ACCESS_DENIED",
        filePath
      };
    }

    const response =
      await fetch(
        "/api/ari-github-read",
        {
          method: "POST",

          headers:
            await CalBuddy.getOwnerRequestHeaders(),

          body: JSON.stringify({
            operation:
              "read_file",

            filePath,

            ...(startLine
              ? { startLine }
              : {}),

            ...(endLine
              ? { endLine }
              : {})
          })
        }
      );

    const data =
      await response
        .json()
        .catch(() => ({}));

    console.log(
      "GitHub Read Response:",
      data
    );

    if (
      !response.ok ||
      data?.success !== true
    ) {
      return {
        success: false,

        error:
          data?.error ||
          "GitHub read failed.",

        code:
          data?.code ||
          "GITHUB_READ_FAILED",

        status:
          response.status,

        filePath,

        raw:
          data
      };
    }

    return data;
  } catch (error) {
    console.error(
      "GitHub Read Error:",
      error
    );

    return {
      success: false,

      error:
        error?.message ||
        "GitHub read failed.",

      code:
        "GITHUB_READ_REQUEST_FAILED",

      filePath
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
CalBuddy.refreshDashboard = function () {
  if (CalBuddy.dashboardRefreshPromise) {
    return CalBuddy.dashboardRefreshPromise;
  }

  const refreshPromise = (async () => {
    const context = await CalBuddy.getUserContext();

    window.dispatchEvent(new CustomEvent("calbuddy:dashboardUpdated", {
      detail: context
    }));

    return context;
  })();

  CalBuddy.dashboardRefreshPromise = refreshPromise;

  return refreshPromise.finally(() => {
    if (CalBuddy.dashboardRefreshPromise === refreshPromise) {
      CalBuddy.dashboardRefreshPromise = null;
    }
  });
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
