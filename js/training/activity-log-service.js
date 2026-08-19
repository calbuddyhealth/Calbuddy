// ARI XP — shared manual/Ari activity logging service.
// Quick Log and Ari vNext use this exact estimator + writer.

import CalorieCalculator from "./energy/calorie-calculator.js";

const VERSION = "1.0.1";
const SOURCE = "js/training/activity-log-service";
const CALORIE_SOURCES = new Set(["user_reported", "profile_estimate", "legacy"]);

function clean(value = "", max = 180) {
  return String(value ?? "").trim().slice(0, max);
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function integer(value) {
  const n = number(value);
  return n === null ? null : Math.round(n);
}

function positive(value) {
  const n = number(value);
  return n !== null && n > 0 ? n : null;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveDateKey(value = "") {
  const text = clean(value, 40).toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  if (!text || text === "today") return localDateKey();
  if (text === "yesterday") {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return localDateKey(date);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? localDateKey() : localDateKey(parsed);
}

function resolveSupabase() {
  return window.calbuddySupabase || window.supabaseClient || window.CalBuddy?.supabase || null;
}

async function resolveUser() {
  if (typeof window.getCurrentUser === "function") {
    const user = await window.getCurrentUser();
    if (user?.id) return user;
  }
  if (typeof window.CalBuddy?.getCurrentUser === "function") {
    const user = await window.CalBuddy.getCurrentUser();
    if (user?.id) return user;
  }
  const client = resolveSupabase();
  const { data } = await client?.auth?.getSession?.() || {};
  return data?.session?.user || null;
}

function localProfile() {
  const confirmedMax = positive(localStorage.getItem("calbuddyConfirmedMaxHeartRate"));
  const estimatedMax = positive(localStorage.getItem("calbuddyEstimatedMaxHeartRate"));
  return {
    age: positive(localStorage.getItem("calbuddyAge")),
    weightLb:
      positive(localStorage.getItem("calbuddyCurrentWeight")) ||
      positive(localStorage.getItem("calbuddyLatestWeight")),
    restingHeartRate: positive(localStorage.getItem("calbuddyRestingHeartRate")),
    maxHeartRate: confirmedMax || estimatedMax,
    source: "local_goals_profile"
  };
}

async function resolveProfile() {
  const cached = localProfile();
  if (cached.weightLb) return cached;

  const client = resolveSupabase();
  const user = await resolveUser();
  if (!client?.from || !user?.id) return cached;

  const { data, error } = await client
    .from("profiles")
    .select("age, weight_lbs, resting_heart_rate, confirmed_max_heart_rate")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data) return cached;

  const age = positive(data.age);
  const estimatedMax = age ? Math.round(220 - age) : null;
  return {
    age,
    weightLb: positive(data.weight_lbs) || cached.weightLb,
    restingHeartRate: positive(data.resting_heart_rate) || cached.restingHeartRate,
    maxHeartRate: positive(data.confirmed_max_heart_rate) || estimatedMax || cached.maxHeartRate,
    source: "cloud_goals_profile"
  };
}

function normalizeIntensity(value = "") {
  const text = clean(value, 40).toLowerCase().replace(/[\s-]+/g, "_");
  if (["very_light", "light", "moderate", "vigorous", "near_maximal", "maximal"].includes(text)) return text;
  if (["easy", "low"].includes(text)) return "light";
  if (["hard", "high", "intense"].includes(text)) return "vigorous";
  return "moderate";
}

function activitySession(activityName, sets, repsPerSet) {
  return {
    title: activityName,
    exercises: [{
      name: activityName,
      sets: integer(sets),
      reps: integer(repsPerSet)
    }]
  };
}

async function estimateActivity(input = {}, profile = null) {
  const activityName = clean(input.activityName || input.activity_name || input.name, 180);
  const durationMinutes = positive(input.durationMinutes ?? input.duration_minutes);
  if (!activityName || !durationMinutes) {
    return { success: false, code: "estimate_requires_activity_and_duration" };
  }

  const resolvedProfile = profile || await resolveProfile();
  if (!positive(resolvedProfile?.weightLb)) {
    return { success: false, code: "profile_weight_required" };
  }

  const averageHeartRate = positive(input.averageHeartRate ?? input.average_heart_rate);
  const estimate = CalorieCalculator.estimateHybridSession({
    session: activitySession(activityName, input.sets, input.repsPerSet ?? input.reps_per_set),
    weightLb: resolvedProfile.weightLb,
    durationMinutes,
    intensity: normalizeIntensity(input.intensity),
    averageHeartRate,
    restingHeartRate: resolvedProfile.restingHeartRate,
    maxHeartRate: resolvedProfile.maxHeartRate
  });

  if (!estimate?.roundedCalories) {
    return { success: false, code: "calorie_estimate_unavailable", profile: resolvedProfile };
  }

  return {
    success: true,
    calories: estimate.roundedCalories,
    estimated: true,
    method: estimate.method || "hybrid_activity_hr_estimate",
    intensity: estimate.intensityId || normalizeIntensity(input.intensity),
    profile: resolvedProfile,
    detail: estimate
  };
}

async function prepareActivity(input = {}, options = {}) {
  const activityName = clean(input.activityName || input.activity_name || input.name, 180);
  if (!activityName) return { success: false, code: "activity_name_required", message: "Activity name is required." };

  const durationMinutes = positive(input.durationMinutes ?? input.duration_minutes);
  const sets = integer(input.sets);
  const repsPerSet = integer(input.repsPerSet ?? input.reps_per_set);
  const totalReps = sets && repsPerSet ? sets * repsPerSet : integer(input.totalReps ?? input.total_reps);
  const averageHeartRate = integer(input.averageHeartRate ?? input.average_heart_rate);
  const enteredCalories = positive(input.caloriesBurned ?? input.calories_burned ?? input.calories);
  const dateKey = resolveDateKey(input.dateText || input.log_date || options.dateText || "");
  const suppliedCalorieSource = clean(input.calorieSource ?? input.calorie_source, 40).toLowerCase();
  const trustedCalorieSource = CALORIE_SOURCES.has(suppliedCalorieSource) ? suppliedCalorieSource : null;
  const suppliedEstimationMethod = clean(input.estimationMethod ?? input.estimation_method, 120) || null;

  if (durationMinutes !== null && (durationMinutes < 1 || durationMinutes > 1440)) {
    return { success: false, code: "activity_duration_out_of_range", message: "Activity duration must be between 1 and 1,440 minutes." };
  }
  if (sets !== null && (sets < 1 || sets > 100)) {
    return { success: false, code: "activity_sets_out_of_range", message: "Sets are outside the supported range." };
  }
  if (repsPerSet !== null && (repsPerSet < 1 || repsPerSet > 10000)) {
    return { success: false, code: "activity_reps_out_of_range", message: "Reps are outside the supported range." };
  }
  if (averageHeartRate !== null && (averageHeartRate < 30 || averageHeartRate > 240)) {
    return { success: false, code: "activity_heart_rate_out_of_range", message: "Average heart rate is outside the supported range." };
  }
  if (enteredCalories !== null && enteredCalories > 10000) {
    return { success: false, code: "activity_calories_out_of_range", message: "Calories burned are outside the supported range." };
  }

  let caloriesBurned = enteredCalories;
  let calorieSource = trustedCalorieSource || (enteredCalories ? "user_reported" : "profile_estimate");
  let estimationMethod = trustedCalorieSource === "profile_estimate"
    ? (suppliedEstimationMethod || "profile_estimate")
    : enteredCalories
      ? (suppliedEstimationMethod || "user_reported")
      : suppliedEstimationMethod;
  let estimate = null;

  if (!caloriesBurned) {
    if (!durationMinutes) {
      return {
        success: false,
        code: "activity_duration_required_for_estimate",
        message: "Duration is required when calories burned are not provided."
      };
    }
    estimate = await estimateActivity({
      activityName,
      durationMinutes,
      sets,
      repsPerSet,
      intensity: input.intensity,
      averageHeartRate
    });
    if (!estimate.success) {
      return {
        success: false,
        code: estimate.code,
        message: estimate.code === "profile_weight_required"
          ? "Complete your current weight in My Goals or enter calories burned manually."
          : "ARI could not estimate calories for this activity. Enter calories burned manually.",
        estimate
      };
    }
    caloriesBurned = estimate.calories;
    calorieSource = "profile_estimate";
    estimationMethod = estimate.method;
  }

  const prepared = {
    activity_name: activityName,
    calories_burned: Math.round(caloriesBurned),
    duration_minutes: durationMinutes,
    sets,
    reps_per_set: repsPerSet,
    total_reps: totalReps,
    intensity: normalizeIntensity(input.intensity),
    average_heart_rate: averageHeartRate,
    calorie_source: calorieSource,
    estimation_method: estimationMethod,
    source: clean(options.source || input.source || "manual_quick_log", 80),
    notes: clean(input.notes, 500) || null,
    log_date: dateKey,
    created_at: new Date().toISOString()
  };

  return { success: true, activity: prepared, estimate };
}

async function logActivity(input = {}, options = {}) {
  const prepared = await prepareActivity(input, options);
  if (!prepared.success) return prepared;

  const client = resolveSupabase();
  const user = await resolveUser();
  if (!client?.from || !user?.id) {
    return { success: false, code: "signed_in_user_required", message: "A signed-in account is required." };
  }

  const row = { user_id: user.id, ...prepared.activity };
  const { data, error } = await client
    .from("activity_logs")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    return { success: false, code: "activity_save_failed", message: error.message || "Activity could not be saved.", error };
  }

  try {
    localStorage.removeItem("calbuddyCaloriesBurned");
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("calbuddyCaloriesBurned_")) localStorage.removeItem(key);
    });
  } catch {}

  window.dispatchEvent(new CustomEvent("ari:activityLogged", {
    detail: { activity: data || row, source: row.source }
  }));

  return {
    success: true,
    activity: data || row,
    estimated: row.calorie_source === "profile_estimate",
    reply: `Logged ${row.activity_name} — ${Math.round(row.calories_burned)} kcal.`
  };
}

async function dailyManualCalories(dateText = "today") {
  const client = resolveSupabase();
  const user = await resolveUser();
  if (!client?.from || !user?.id) return 0;
  const dateKey = resolveDateKey(dateText);
  const { data, error } = await client
    .from("activity_logs")
    .select("calories_burned")
    .eq("user_id", user.id)
    .eq("log_date", dateKey);
  if (error || !Array.isArray(data)) return 0;
  return Math.round(data.reduce((sum, item) => sum + Math.max(Number(item?.calories_burned) || 0, 0), 0));
}

const ActivityLogService = Object.freeze({
  version: VERSION,
  source: SOURCE,
  localDateKey,
  resolveDateKey,
  resolveProfile,
  estimateActivity,
  prepareActivity,
  logActivity,
  dailyManualCalories
});

if (typeof window !== "undefined") {
  window.AriActivityLogService = ActivityLogService;
}

export {
  VERSION,
  SOURCE,
  localDateKey,
  resolveDateKey,
  resolveProfile,
  estimateActivity,
  prepareActivity,
  logActivity,
  dailyManualCalories,
  ActivityLogService
};

export default ActivityLogService;
