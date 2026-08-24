// =====================================================
// ARI XP
// File: ari/personalization/ari-personalization-engine.js
// Version: 1.0.0
// Purpose:
//   Build a user-scoped, deterministic personalization packet from
//   recent Training and Nutrition behavior without an extra OpenAI call.
//
// Guardrails:
//   - Learned patterns are advisory only.
//   - Explicit user preferences/instructions always take precedence.
//   - No Circle/social data is read, scored, or returned.
//   - No learned pattern silently changes persisted Ari preferences.
//   - No medical/causal conclusions are inferred from behavioral data.
// =====================================================

(() => {
  "use strict";

  window.Ari = window.Ari || {};

  const VERSION = "1.0.0";
  const SOURCE = "ari-personalization-engine";
  const WINDOW_DAYS = 45;
  const CACHE_TTL_MS = 10 * 60 * 1000;
  const MAX_ACTIVITY_ROWS = 120;
  const MAX_MEAL_ROWS = 240;

  const cache = new Map();

  function clone(value) {
    if (value === undefined) return undefined;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function positive(value) {
    const parsed = number(value);
    return parsed !== null && parsed > 0 ? parsed : null;
  }

  function round(value, digits = 0) {
    const factor = 10 ** digits;
    return Math.round((Number(value) || 0) * factor) / factor;
  }

  function normalize(value = "") {
    return String(value || "")
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[_-]/g, " ")
      .replace(/[^\w\s']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function titleCase(value = "") {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  function median(values = []) {
    const sorted = values
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);

    if (!sorted.length) return null;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function average(values = []) {
    const valid = values.map(Number).filter(Number.isFinite);
    if (!valid.length) return null;
    return valid.reduce((sum, value) => sum + value, 0) / valid.length;
  }

  function localDateKey(value) {
    const date = value instanceof Date ? new Date(value) : new Date(value || "");
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function confidence(sampleSize = 0, dominance = null) {
    const n = Math.max(Number(sampleSize) || 0, 0);
    let level = n >= 10 ? "high" : n >= 5 ? "medium" : n >= 3 ? "low" : "insufficient";

    if (dominance !== null && Number.isFinite(Number(dominance))) {
      const share = Number(dominance);
      if (share < 0.45) level = "insufficient";
      else if (share < 0.6 && level === "high") level = "medium";
    }

    return level;
  }

  function topCounts(values = [], limit = 3) {
    const counts = new Map();
    const labels = new Map();

    values.forEach(value => {
      const raw = String(value || "").trim();
      const key = normalize(raw);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
      if (!labels.has(key)) labels.set(key, raw);
    });

    return [...counts.entries()]
      .map(([key, count]) => ({
        key,
        label: labels.get(key) || key,
        count
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, limit);
  }

  function daypart(dateValue) {
    const date = new Date(dateValue || "");
    if (Number.isNaN(date.getTime())) return null;
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 22) return "evening";
    return "night";
  }

  function resolveSupabase() {
    return (
      window.calbuddySupabase ||
      window.supabaseClient ||
      window.CalBuddy?.supabase ||
      window.supabase ||
      null
    );
  }

  async function resolveUser(client) {
    try {
      if (typeof window.getCurrentUser === "function") {
        const user = await window.getCurrentUser();
        if (user?.id) return user;
      }
    } catch {}

    try {
      if (typeof window.CalBuddy?.getCurrentUser === "function") {
        const user = await window.CalBuddy.getCurrentUser();
        if (user?.id) return user;
      }
    } catch {}

    try {
      const { data } = await client?.auth?.getUser?.() || {};
      if (data?.user?.id) return data.user;
    } catch {}

    try {
      const { data } = await client?.auth?.getSession?.() || {};
      return data?.session?.user || null;
    } catch {
      return null;
    }
  }

  function cutoff(now = new Date()) {
    const date = new Date(now);
    date.setDate(date.getDate() - WINDOW_DAYS);
    return date;
  }

  async function loadActivities(client, userId, now = new Date()) {
    if (!client?.from || !userId) return [];

    const startDate = localDateKey(cutoff(now));
    try {
      const { data, error } = await client
        .from("activity_logs")
        .select("activity_name, calories_burned, duration_minutes, intensity, average_heart_rate, log_date, created_at")
        .eq("user_id", userId)
        .gte("log_date", startDate)
        .order("log_date", { ascending: false })
        .limit(MAX_ACTIVITY_ROWS);

      if (error || !Array.isArray(data)) return [];
      return data;
    } catch {
      return [];
    }
  }

  async function loadMeals(client, userId, now = new Date()) {
    if (!client?.from || !userId) return [];

    try {
      const { data, error } = await client
        .from("meals")
        .select("name, calories, protein_g, carbs_g, fat_g, category, nutrition_date, created_at")
        .eq("user_id", userId)
        .gte("created_at", cutoff(now).toISOString())
        .order("created_at", { ascending: false })
        .limit(MAX_MEAL_ROWS);

      if (error || !Array.isArray(data)) return [];
      return data;
    } catch {
      return [];
    }
  }

  function trainingPatterns(activities = []) {
    const valid = (Array.isArray(activities) ? activities : [])
      .filter(item => item && (item.activity_name || item.duration_minutes || item.calories_burned));

    const durations = valid.map(item => positive(item.duration_minutes)).filter(Boolean);
    const calories = valid.map(item => positive(item.calories_burned)).filter(Boolean);
    const activityNames = topCounts(valid.map(item => item.activity_name), 3);
    const uniqueDays = new Set(
      valid
        .map(item => item.log_date || localDateKey(item.created_at))
        .filter(Boolean)
    );

    const windows = topCounts(valid.map(item => daypart(item.created_at)).filter(Boolean), 4);
    const topWindow = windows[0] || null;
    const windowShare = topWindow && valid.length ? topWindow.count / valid.length : null;
    const windowConfidence = confidence(valid.length, windowShare);

    const patterns = [];

    if (durations.length >= 3) {
      patterns.push({
        id: "training.typical_duration",
        domain: "training",
        label: "Typical session duration",
        value: Math.round(median(durations)),
        unit: "minutes",
        sampleSize: durations.length,
        confidence: confidence(durations.length),
        basis: "completed activity logs"
      });
    }

    if (activityNames[0]?.count >= 2) {
      patterns.push({
        id: "training.frequent_activities",
        domain: "training",
        label: "Frequently logged activities",
        value: activityNames.map(item => ({
          name: titleCase(item.label),
          count: item.count
        })),
        sampleSize: valid.length,
        confidence: confidence(valid.length),
        basis: "completed activity names"
      });
    }

    if (topWindow && windowConfidence !== "insufficient") {
      patterns.push({
        id: "training.usual_window",
        domain: "training",
        label: "Usual activity logging window",
        value: topWindow.label,
        share: round(windowShare, 2),
        sampleSize: valid.length,
        confidence: windowConfidence,
        basis: "activity log timestamps",
        caveat: "Logging time may differ from actual workout start time."
      });
    }

    return {
      sessionCount: valid.length,
      activeDayCount: uniqueDays.size,
      medianDurationMinutes: durations.length >= 3 ? Math.round(median(durations)) : null,
      averageCaloriesPerSession: calories.length >= 3 ? Math.round(average(calories)) : null,
      frequentActivities: activityNames,
      patterns
    };
  }

  function nutritionPatterns(meals = []) {
    const valid = (Array.isArray(meals) ? meals : [])
      .filter(item => item && (item.name || positive(item.calories) || positive(item.protein_g)));

    const byDay = new Map();

    valid.forEach(meal => {
      const key = meal.nutrition_date || localDateKey(meal.created_at);
      if (!key) return;
      const current = byDay.get(key) || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        mealCount: 0
      };

      current.calories += Math.max(number(meal.calories) || 0, 0);
      current.protein += Math.max(number(meal.protein_g) || 0, 0);
      current.carbs += Math.max(number(meal.carbs_g) || 0, 0);
      current.fat += Math.max(number(meal.fat_g) || 0, 0);
      current.mealCount += 1;
      byDay.set(key, current);
    });

    const days = [...byDay.values()];
    const recurringMeals = topCounts(valid.map(item => item.name), 3);
    const patterns = [];

    if (days.length >= 3) {
      patterns.push({
        id: "nutrition.logged_day_baseline",
        domain: "nutrition",
        label: "Typical logged nutrition day",
        value: {
          calories: Math.round(average(days.map(day => day.calories)) || 0),
          proteinG: Math.round(average(days.map(day => day.protein)) || 0),
          carbsG: Math.round(average(days.map(day => day.carbs)) || 0),
          fatG: Math.round(average(days.map(day => day.fat)) || 0),
          meals: round(average(days.map(day => day.mealCount)) || 0, 1)
        },
        sampleSize: days.length,
        confidence: confidence(days.length),
        basis: "days with logged meals",
        caveat: "This describes logged intake, not necessarily total intake or a target."
      });
    }

    if (recurringMeals[0]?.count >= 2) {
      patterns.push({
        id: "nutrition.recurring_meals",
        domain: "nutrition",
        label: "Frequently logged meals",
        value: recurringMeals.map(item => ({
          name: titleCase(item.label),
          count: item.count
        })),
        sampleSize: valid.length,
        confidence: confidence(valid.length),
        basis: "meal ledger names"
      });
    }

    return {
      mealCount: valid.length,
      loggedDayCount: days.length,
      averageCaloriesPerLoggedDay: days.length >= 3
        ? Math.round(average(days.map(day => day.calories)) || 0)
        : null,
      averageProteinPerLoggedDay: days.length >= 3
        ? Math.round(average(days.map(day => day.protein)) || 0)
        : null,
      recurringMeals,
      patterns
    };
  }

  function patternFact(pattern) {
    const confidenceText = pattern.confidence || "low";
    const n = pattern.sampleSize || 0;

    if (pattern.id === "training.typical_duration") {
      return `Observed user pattern (advisory, ${confidenceText} confidence, n=${n}): logged training sessions typically last about ${pattern.value} minutes. Explicit user instructions override this pattern.`;
    }

    if (pattern.id === "training.frequent_activities") {
      const names = pattern.value.map(item => item.name).join(", ");
      return `Observed user pattern (advisory, ${confidenceText} confidence, n=${n}): frequently logged activities include ${names}. Do not treat this as an explicit preference.`;
    }

    if (pattern.id === "training.usual_window") {
      return `Observed user pattern (advisory, ${confidenceText} confidence, n=${n}): activity logs most often occur in the ${pattern.value}. This is a timing hint only; logging time may differ from workout time.`;
    }

    if (pattern.id === "nutrition.logged_day_baseline") {
      const value = pattern.value || {};
      return `Observed user pattern (advisory, ${confidenceText} confidence, n=${n} logged days): typical logged intake is about ${value.calories} kcal and ${value.proteinG} g protein per logged day. This is a historical baseline, not a nutrition target.`;
    }

    if (pattern.id === "nutrition.recurring_meals") {
      const names = pattern.value.map(item => item.name).join(", ");
      return `Observed user pattern (advisory, ${confidenceText} confidence, n=${n}): recurring logged meals include ${names}. Do not assume the user wants these unless relevant.`;
    }

    return null;
  }

  function buildPacket({ userId = null, activities = [], meals = [], now = new Date(), source = "rows" } = {}) {
    const training = trainingPatterns(activities);
    const nutrition = nutritionPatterns(meals);
    const patterns = [...training.patterns, ...nutrition.patterns]
      .filter(pattern => pattern.confidence !== "insufficient");
    const facts = patterns.map(patternFact).filter(Boolean).slice(0, 8);

    const overallConfidence = patterns.some(item => item.confidence === "high")
      ? "high"
      : patterns.some(item => item.confidence === "medium")
        ? "medium"
        : patterns.length
          ? "low"
          : "insufficient";

    return {
      ready: true,
      available: facts.length > 0,
      source: SOURCE,
      version: VERSION,
      userId,
      analyzedAt: new Date(now).toISOString(),
      windowDays: WINDOW_DAYS,
      dataSource: source,
      domains: ["training", "nutrition"],
      excludedDomains: ["circle", "social", "feed", "friends", "challenges"],
      training,
      nutrition,
      patterns,
      facts,
      confidence: overallConfidence,
      instructionText: facts.length
        ? "Use learned patterns only when they are relevant and helpful. They are observations, not explicit preferences, goals, diagnoses, or causal findings. Explicit user instructions and saved communication preferences take precedence. Never infer or use Circle/social behavior from this packet."
        : "No sufficiently supported learned pattern is available yet.",
      authority: {
        role: "advisory_behavioral_personalization",
        mayInformRecommendations: true,
        mayOverrideExplicitUserPreference: false,
        mayPersistPreferenceChanges: false,
        mayOverrideSafety: false,
        mayUseCircleData: false,
        mayClaimCausality: false
      }
    };
  }

  async function analyze(input = {}) {
    const now = input.now ? new Date(input.now) : new Date();

    if (Array.isArray(input.activities) || Array.isArray(input.meals)) {
      return buildPacket({
        userId: input.userId || null,
        activities: input.activities || [],
        meals: input.meals || [],
        now,
        source: "provided_rows"
      });
    }

    const client = input.supabaseClient || resolveSupabase();
    const user = input.user || await resolveUser(client);

    if (!client?.from || !user?.id) {
      return buildPacket({
        userId: user?.id || null,
        activities: [],
        meals: [],
        now,
        source: "unavailable"
      });
    }

    const cached = cache.get(user.id);
    if (
      input.force !== true &&
      cached &&
      Date.now() - cached.loadedAt < CACHE_TTL_MS
    ) {
      return clone(cached.packet);
    }

    const [activitiesResult, mealsResult] = await Promise.allSettled([
      loadActivities(client, user.id, now),
      loadMeals(client, user.id, now)
    ]);

    const activities = activitiesResult.status === "fulfilled"
      ? activitiesResult.value
      : [];
    const meals = mealsResult.status === "fulfilled"
      ? mealsResult.value
      : [];

    const packet = buildPacket({
      userId: user.id,
      activities,
      meals,
      now,
      source: "supabase"
    });

    cache.set(user.id, {
      loadedAt: Date.now(),
      packet: clone(packet)
    });

    return packet;
  }

  function invalidate(userId = null) {
    if (userId) cache.delete(userId);
    else cache.clear();
    return true;
  }

  const AriPersonalizationEngine = Object.freeze({
    version: VERSION,
    source: SOURCE,
    analyze,
    buildPacket,
    trainingPatterns,
    nutritionPatterns,
    confidence,
    invalidate
  });

  window.AriPersonalizationEngine = AriPersonalizationEngine;
  window.Ari.personalizationEngine = AriPersonalizationEngine;

  window.addEventListener?.("ari:activityChanged", () => invalidate());
  window.addEventListener?.("calbuddy:mealsChanged", () => invalidate());
  window.addEventListener?.("ari:meal-ledger-synced", () => invalidate());

  console.log("ARI PERSONALIZATION ENGINE LOADED:", VERSION);
})();
