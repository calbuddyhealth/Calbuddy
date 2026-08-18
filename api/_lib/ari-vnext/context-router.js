// ARI vNext — decide which existing app context is relevant to this turn.
// This is intentionally small. The primary model still owns semantic judgment.

export const CONTEXT_ROUTER_VERSION = "1.0.0";

const PATTERNS = {
  nutrition: /\b(calorie|calories|macro|macros|protein|carb|carbs|fat|meal|food|eat|ate|nutrition|breakfast|lunch|dinner|snack)\b/i,
  training: /\b(workout|training|train|exercise|lift|lifting|sets?|reps?|shoulder|chest|back|legs?|arms?|cardio|run|running|gym|strength|rest day|recovery)\b/i,
  goals: /\b(goal|weight|cut|bulk|maintain|maintenance|lose|gain|progress|target|bmi|calorie goal)\b/i,
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

  return {
    version: CONTEXT_ROUTER_VERSION,
    recentConversation: true,
    profile: true,
    nutrition: PATTERNS.nutrition.test(semanticText),
    training: PATTERNS.training.test(semanticText),
    goals: PATTERNS.goals.test(semanticText),
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

  if (route.goals) selected.goals = source?.goals || source?.healthProfile || {};
  if (route.nutrition) {
    selected.nutrition = source?.nutrition || {};
    selected.mealsToday = Array.isArray(source?.mealsToday) ? source.mealsToday.slice(0, 12) : [];
  }
  if (route.training) {
    selected.training = source?.training || {};
    selected.trainingToday = source?.trainingToday || source?.todayWorkout || null;
    selected.recentTraining = Array.isArray(source?.recentTraining) ? source.recentTraining.slice(0, 8) : [];
  }
  if (route.social) selected.social = source?.social || {};
  if (route.memory && turn?.memory) selected.relevantMemory = turn.memory;

  return selected;
}

export function contextToText(context = {}) {
  try {
    return JSON.stringify(context, null, 2).slice(0, 14000);
  } catch {
    return "{}";
  }
}

function isFollowUp(message = "") {
  const text = String(message || "").trim();
  if (!text || text.length > 180) return false;
  return /^(why|how|how so|what about|and|but|then|really|you sure|are you sure|what do you mean|explain|tell me more|make it|do that|the other one|instead|okay|ok|yeah|yes|no|nope)\b/i.test(text);
}

function estimateComplexity(message = "") {
  const text = String(message || "");
  if (text.length > 1800) return "deep";
  if (/\b(compare|analyze|review|plan|strategy|why.*and|pros and cons|tradeoff|trend|over the last|history)\b/i.test(text)) return "deep";
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
