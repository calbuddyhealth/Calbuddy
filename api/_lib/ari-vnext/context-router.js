// ARI vNext — decide which existing app context is relevant to this turn.
// This is intentionally small. The primary model still owns semantic judgment.

export const CONTEXT_ROUTER_VERSION = "1.1.0";

const PATTERNS = {
  nutrition: /\b(calorie|calories|macro|macros|protein|carb|carbs|fat|meal|food|eat|ate|nutrition|breakfast|lunch|dinner|snack|diet)\b/i,
  training: /\b(workout|training|train|exercise|lift|lifting|sets?|reps?|shoulder|chest|back|legs?|arms?|cardio|run|running|gym|strength|rest day|recovery)\b/i,
  goals: /\b(goal|weight|cut|bulk|maintain|maintenance|lose|gain|progress|target|bmi|calorie goal|pace|trend)\b/i,
  social: /\b(circle|friend|friends|challenge|moment|post|reaction|comment|message|buddy)\b/i,
  memory: /\b(last time|before|remember|you know|again|like last|what did i|what was|my wife|my husband|my brother|my sister|my friend)\b/i,
  health: /\b(injury|injured|pain|sore|soreness|medical|medicine|medication|symptom|pregnan|blood pressure|heart rate|doctor|nurse)\b/i,
  currentInfo: /\b(latest|today's news|news|weather|forecast|price|score|current president|current ceo|right now)\b/i,
  developer: /\b(github|repo|repository|branch|commit|deploy|vercel|supabase|pipeline|runtime|debug|code|javascript|html|css|sql|api)\b/i
};

export function routeContext(turn = {}) {
  const message = String(turn?.message || "");
  const followUp = isFollowUp(message);
  const recent = (turn?.history || []).slice(-4).map((item) => item?.content || "").join("\n");
  const semanticText = followUp ? `${recent}\n${message}` : message;

  const nutrition = PATTERNS.nutrition.test(semanticText);
  const training = PATTERNS.training.test(semanticText);
  const goals = PATTERNS.goals.test(semanticText);

  return {
    version: CONTEXT_ROUTER_VERSION,
    recentConversation: true,
    profile: true,
    nutrition,
    training,
    goals,
    coachingState: nutrition && (training || goals) || training && goals,
    social: PATTERNS.social.test(semanticText),
    memory: PATTERNS.memory.test(semanticText) || followUp,
    health: PATTERNS.health.test(semanticText),
    currentInfo: PATTERNS.currentInfo.test(semanticText),
    developer: PATTERNS.developer.test(semanticText),
    followUp,
    complexity: estimateComplexity(message)
  };
}

export function buildRelevantContext(turn = {}, route = {}) {
  const source = turn?.context && typeof turn.context === "object" ? turn.context : {};
  const selected = {
    surface: turn?.surface || "unknown",
    user: pickObject(source?.user, ["displayName", "firstName", "age", "sex", "height", "activityLevel"])
  };

  if (route.goals) {
    selected.goals = source?.goals || source?.healthProfile || {};
    selected.recentWeights = Array.isArray(source?.recentWeights)
      ? source.recentWeights.slice(0, 10).map(compactWeight)
      : [];
  }

  if (route.nutrition) {
    selected.nutrition = source?.nutrition || {};
    selected.mealsToday = Array.isArray(source?.mealsToday)
      ? source.mealsToday.slice(0, 12).map(compactMeal)
      : [];
    selected.recentMeals = Array.isArray(source?.recentMeals)
      ? source.recentMeals.slice(0, 10).map(compactMeal)
      : [];
    selected.favoriteFoods = Array.isArray(source?.favoriteFoods)
      ? source.favoriteFoods.slice(0, 8).map(compactMeal)
      : [];
  }

  if (route.training) {
    selected.training = source?.training || {};
    selected.trainingToday = source?.trainingToday || source?.todayWorkout || null;
    selected.recentTraining = Array.isArray(source?.recentTraining) ? source.recentTraining.slice(0, 12) : [];
  }

  if (route.coachingState) {
    selected.coachingSnapshot = buildCoachingSnapshot(source);
  }

  if (route.social) selected.social = source?.social || {};
  if (route.memory && turn?.memory) selected.relevantMemory = turn.memory;

  return selected;
}

export function contextToText(context = {}) {
  try {
    return JSON.stringify(context, null, 2).slice(0, 16000);
  } catch {
    return "{}";
  }
}

function buildCoachingSnapshot(source = {}) {
  const goals = source?.goals || {};
  const today = Array.isArray(source?.mealsToday) ? source.mealsToday : [];
  const recentTraining = Array.isArray(source?.recentTraining) ? source.recentTraining : [];
  const recentWeights = Array.isArray(source?.recentWeights) ? source.recentWeights : [];

  const macroTotals = today.reduce((totals, meal) => {
    totals.calories += numeric(meal?.calories);
    totals.proteinG += numeric(meal?.protein_g ?? meal?.proteinG);
    totals.carbsG += numeric(meal?.carbs_g ?? meal?.carbsG);
    totals.fatG += numeric(meal?.fat_g ?? meal?.fatG);
    return totals;
  }, { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });

  return {
    today: {
      calorieGoal: nullableNumber(goals?.dailyGoal),
      caloriesConsumed: nullableNumber(goals?.caloriesConsumed) ?? macroTotals.calories,
      caloriesBurned: nullableNumber(goals?.caloriesBurned),
      caloriesLeft: nullableNumber(goals?.caloriesLeft),
      proteinG: round1(macroTotals.proteinG),
      carbsG: round1(macroTotals.carbsG),
      fatG: round1(macroTotals.fatG),
      mealCount: today.length
    },
    training: {
      recentWorkoutCount: recentTraining.filter((item) => item?.type === "workout").length,
      recentCompletedCount: recentTraining.filter((item) => item?.completed === true).length
    },
    weight: weightTrend(recentWeights)
  };
}

function weightTrend(rows = []) {
  const points = rows
    .map((item) => ({
      value: nullableNumber(item?.weight_lbs ?? item?.weight ?? item?.value),
      date: item?.logged_at || item?.created_at || item?.date || null
    }))
    .filter((item) => item.value !== null)
    .slice(0, 10);

  if (points.length < 2) {
    return { available: false, latest: points[0]?.value ?? null, change: null, direction: "unknown" };
  }

  const latest = points[0].value;
  const oldest = points[points.length - 1].value;
  const change = round1(latest - oldest);

  return {
    available: true,
    latest,
    oldest,
    change,
    direction: change > 0.2 ? "up" : change < -0.2 ? "down" : "stable",
    pointCount: points.length
  };
}

function compactMeal(meal = {}) {
  return {
    name: String(meal?.name || "Meal").slice(0, 120),
    calories: nullableNumber(meal?.calories),
    proteinG: nullableNumber(meal?.protein_g ?? meal?.proteinG),
    carbsG: nullableNumber(meal?.carbs_g ?? meal?.carbsG),
    fatG: nullableNumber(meal?.fat_g ?? meal?.fatG),
    category: meal?.category || null,
    date: meal?.nutrition_date || meal?.created_at || null
  };
}

function compactWeight(item = {}) {
  return {
    value: nullableNumber(item?.weight_lbs ?? item?.weight ?? item?.value),
    date: item?.logged_at || item?.created_at || item?.date || null
  };
}

function isFollowUp(message = "") {
  const text = String(message || "").trim();
  if (!text || text.length > 180) return false;
  return /^(why|how|how so|what about|and|but|then|really|you sure|are you sure|what do you mean|explain|tell me more|make it|do that|the other one|instead|okay|ok|yeah|yes|no|nope)\b/i.test(text);
}

function estimateComplexity(message = "") {
  const text = String(message || "");
  if (text.length > 1800) return "deep";
  if (/\b(compare|analyze|review|plan|strategy|why.*and|pros and cons|tradeoff|trend|over the last|history|on pace)\b/i.test(text)) return "deep";
  if (text.length > 500) return "standard";
  return "fast";
}

function pickObject(value, keys = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output = {};
  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null && value[key] !== "") output[key] = value[key];
  }
  return output;
}

function numeric(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function round1(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}
