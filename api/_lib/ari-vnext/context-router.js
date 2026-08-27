// ARI vNext — decide which existing app context is relevant to this turn.
// This is intentionally small. The primary model still owns semantic judgment.

import { advancedConversationInstruction } from "./conversation-contract.js";
import { activeReferenceDomains, buildReferencePacket, isReferenceFollowUp } from "./reference-context.js";

export const CONTEXT_ROUTER_VERSION = "1.18.0";

const PATTERNS = {
  nutrition: /\b(calorie|calories|macro|macros|protein|carb|carbs|fat|meal|food|eat|ate|nutrition|breakfast|lunch|dinner|snack|diet|fuel|fueling|hungry|hunger)\b/i,
  nutritionLogging: /\b(?:log|record|save)\b|\b(?:add|track)\b(?=[^?.!]{0,90}\b(?:food|meal|breakfast|lunch|dinner|snack|calories?|protein|carbs?|fat|eggs?|chicken|rice|potato|beer|drink)\b)/i,
  training: /\b(workout|training|train|trained|exercise|exercised|lift|lifted|lifting|sets?|reps?|shoulder|chest|back|legs?|arms?|cardio|run|ran|running|jog|jogged|jogging|walk|walked|walking|bike|biked|biking|cycle|cycled|cycling|hike|hiked|hiking|swim|swam|swimming|row|rowed|rowing|elliptical|stairs?|stairmaster|stepmill|push[ -]?ups?|pull[ -]?ups?|burpees?|calisthenics?|basketball|soccer|tennis|gym|strength|rest day|recovery|plateau|pr|personal record|progression|volume|frequency|missed workout|experiment|hypothesis|intervention|observation window)\b/i,
  goals: /\b(goal|weight|cut|bulk|maintain|maintenance|lose|gain|progress|target|bmi|calorie goal|pace|trend|velocity|on pace)\b/i,
  social: /\b(circle|friend|friends|challenge|moment|post|reaction|comment|message|buddy|meet[ -]?ups?|missions?|quests?|crews?|hosting?|hosted|join requests?|open spots?|opportunit(?:y|ies)|activity partner|workout partner|training partner)\b/i,
  memory: /\b(last time|before|remember|you know|again|like last|what did i|what was|what do i prefer|what do i like|what do i dislike|my favorite|my favourite|i prefer|i dislike|from now on|going forward|correction|my wife|my husband|my brother|my sister|my friend)\b/i,
  health: /\b(injury|injured|pain|sore|soreness|medical|medicine|medication|symptom|pregnan|blood pressure|heart rate|doctor|nurse)\b/i,
  liveInfo: /\b(news|weather|forecast|price|prices|score|scores|standings|stock price|market price|exchange rate|release date|availability|president|vice president|prime minister|governor|mayor|senator|representative|congress|supreme court|ceo|cfo|chairman|officeholder|administration|cabinet|election|elections|poll|polls|in office|who is .* president|who's .* president)\b/i,
  recency: /\b(latest|current|currently|today(?:'s)?|tonight|this week|this month|this year|right now|as of now|newest|recent)\b/i,
  changingReference: /\b(research|study|studies|guideline|guidelines|recommendation|recommendations|evidence|software|version|release)\b/i,
  developer: /\b(github|repo|repository|branch|commit|deploy|vercel|supabase|pipeline|runtime|debug|code|javascript|html|css|sql|api)\b/i
};

export function routeContext(turn = {}) {
  const message = String(turn?.message || "");
  const followUp = isFollowUp(message) || isReferenceFollowUp(message);
  const recent = (turn?.history || []).slice(-4).map((item) => item?.content || "").join("\n");
  const semanticText = followUp ? `${recent}\n${message}` : message;
  const referenceDomains = followUp ? activeReferenceDomains(turn?.context?.referenceState) : [];
  const account = turn?.context?.accountEntitlements || {};
  const intelligenceEntitlement = turn?.context?.intelligenceEntitlement || null;
  const teenMode = account?.teenMode === true || String(account?.ageBand || "").toLowerCase() === "teen";

  const nutrition = PATTERNS.nutrition.test(semanticText) || referenceDomains.includes("nutrition");
  // Model routing must be based on the CURRENT user's logging wording, not on
  // history. Prior turns may identify the food target, but they never convert a
  // read-only/advice turn into a cheap mutation-interpreter turn.
  const nutritionLogging = nutrition && PATTERNS.nutritionLogging.test(message);
  const training = PATTERNS.training.test(semanticText) || referenceDomains.includes("training");
  const goals = PATTERNS.goals.test(semanticText) || referenceDomains.includes("goals");
  const actionNetworkAvailable = turn?.context?.social?.actionNetwork?.available === true;
  const social = PATTERNS.social.test(semanticText) || actionNetworkAvailable || referenceDomains.includes("social");
  const memory = PATTERNS.memory.test(semanticText) || followUp;
  const health = PATTERNS.health.test(semanticText);
  const currentInfo = needsCurrentInfo(semanticText);
  const developer = PATTERNS.developer.test(semanticText) || referenceDomains.includes("developer");
  const casualConversation = isCasualConversation({
    message,
    followUp,
    nutrition,
    training,
    goals,
    social,
    memory,
    health,
    currentInfo,
    developer
  });

  return {
    version: CONTEXT_ROUTER_VERSION,
    recentConversation: true,
    profile: !casualConversation,
    nutrition,
    nutritionLogging,
    training,
    goals,
    coachingState: nutrition && (training || goals) || training && goals,
    social,
    memory,
    health,
    currentInfo,
    developer,
    teenMode,
    circleAllowed: account?.circleAllowed === true,
    intelligenceEntitlement,
    followUp,
    casualConversation,
    complexity: estimateComplexity(message)
  };
}

export function buildRelevantContext(turn = {}, route = {}) {
  const source = turn?.context && typeof turn.context === "object" ? turn.context : {};
  const selected = {
    surface: turn?.surface || "unknown",
    user: pickObject(source?.user, ["displayName", "firstName", "age", "sex", "height", "activityLevel"])
  };

  const referencePacket = buildReferencePacket(turn, route);
  if (referencePacket) selected.referencePacket = referencePacket;

  if (source?.accountEntitlements && typeof source.accountEntitlements === "object") {
    selected.accountEntitlements = pickObject(source.accountEntitlements, [
      "version", "status", "ageBand", "ageVerified", "teenMode", "appAllowed", "circleAllowed", "circleMinimumAge"
    ]);
  }

  if (source?.intelligenceEntitlement && typeof source.intelligenceEntitlement === "object") {
    selected.intelligenceEntitlement = pickObject(source.intelligenceEntitlement, [
      "version", "tier", "accountRole", "subscriptionTier", "subscriptionStatus", "accessClass", "intelligenceTier",
      "advancedAllowed", "advancedEnabled", "ownerEligible", "premiumEligible", "reasoningProfile", "conversationBeta", "source"
    ]);
  }

  if (source?.userWorldModel && typeof source.userWorldModel === "object") {
    selected.userWorldModel = source.userWorldModel;
  }

  if (route.goals) {
    selected.goals = source?.goals || source?.healthProfile || {};
    selected.recentWeights = Array.isArray(source?.recentWeights)
      ? source.recentWeights.slice(0, 30).map(compactWeight)
      : [];
  }

  if (route.nutrition) {
    selected.nutrition = source?.nutrition || {};
    selected.mealsToday = Array.isArray(source?.mealsToday)
      ? source.mealsToday.slice(0, 16).map(compactMeal)
      : [];
    selected.recentMeals = Array.isArray(source?.recentMeals)
      ? source.recentMeals.slice(0, 32).map(compactMeal)
      : [];
    selected.favoriteFoods = Array.isArray(source?.favoriteFoods)
      ? source.favoriteFoods.slice(0, 10).map(compactMeal)
      : [];
  }

  if (route.training) {
    selected.training = source?.training || {};
    selected.trainingToday = source?.trainingToday || source?.todayWorkout || null;
    selected.recentTraining = Array.isArray(source?.recentTraining)
      ? source.recentTraining.slice(0, 42)
      : [];
  }

  if (route.coachingState) selected.coachingSnapshot = buildCoachingSnapshot(source);
  if (route.social) selected.social = source?.social || {};

  if ((route.training || route.nutrition || route.goals) && source?.experimentLedger) {
    selected.experimentLedger = source.experimentLedger;
  }

  if ((route.training || route.nutrition || route.goals) && source?.decisionState) {
    selected.decisionState = source.decisionState;
  }

  if ((route.training || route.nutrition || route.goals) && source?.communicationLearning) {
    selected.communicationLearning = source.communicationLearning;
  }

  if ((route.training || route.nutrition || route.goals) && source?.temporalTimeline) {
    selected.temporalTimeline = source.temporalTimeline;
  }

  if (turn?.memory && (route.memory || route.training || route.nutrition || route.goals)) {
    selected.relevantMemory = turn.memory;
  }

  return selected;
}

export function contextToText(context = {}) {
  try {
    const rules = cognitiveContextRules(context);
    const json = JSON.stringify(context, null, 2).slice(0, 22500);
    return [rules, json].filter(Boolean).join("\n\n").slice(0, 24000);
  } catch {
    return "{}";
  }
}

function cognitiveContextRules(context = {}) {
  const lines = [];
  const conversationInstruction = advancedConversationInstruction(context?.intelligenceEntitlement);

  if (conversationInstruction) {
    lines.push(conversationInstruction);
  }

  if (context?.referencePacket?.active === true) {
    lines.push(
      "REFERENCE RESOLUTION RULES:",
      "- The CURRENT user message alone determines whether a mutation is authorized. Recent conversation or prior app references never grant write permission by themselves.",
      "- The bounded Reference Packet may identify what words such as it, them, that, those, this, the other one, or the second one refer to.",
      "- app_reference candidates are bounded pointers produced from trusted app action lifecycle state; they are not a second database.",
      "- A verified persisted app_reference should be preferred for object identity/canonical locator when it matches the current domain. Conversation text may explain the object but must not override its canonical identity.",
      "- When the current message explicitly requests a supported mutation and a reference resolves its target unambiguously, use that resolved target with the matching application tool.",
      "- Prefer the nearest domain-compatible candidate. If authoritative application state conflicts with conversational wording, authoritative application state wins.",
      "- If two candidates are materially plausible, ask one concise clarification question instead of guessing.",
      "- Never invent a missing target, quantity, date, identity, or persisted record merely to complete an action."
    );
  }

  if (context?.accountEntitlements?.teenMode === true) {
    lines.push(
      "ACCOUNT AGE RULES:",
      "- Teen mode is server-derived account context, not a memory or user-claimed fact.",
      "- Do not infer a different age from conversation or help bypass the adult-only ARI Circle entitlement.",
      "- Never expose or request the user's DOB merely to change authorization."
    );
  }

  if (context?.social?.actionNetwork?.available === true) {
    lines.push(
      "ARI CIRCLE ACTION NETWORK RULES:",
      "- Action Network context is authoritative read-only Circle state for this signed-in user.",
      "- Use opportunities, active intents, schedule state, and match reasons as factual app context; do not invent unavailable activities or people.",
      "- Match scores rank opportunity fit for a specific intent. They are not ratings of a person's worth, attractiveness, safety, or character.",
      "- Exact meeting points, direct messages, raw coordinates, and raw feed content are intentionally absent. Never infer or reconstruct them.",
      "- This context does not authorize a mutation. Never claim that Ari joined, hosted, cancelled, messaged, accepted, or changed Circle state unless a trusted executor later verifies it."
    );
  }

  if (context?.userWorldModel) {
    lines.push(
      "USER WORLD MODEL RULES:",
      "- Separate stated goals/preferences from observed behavior and measured response.",
      "- A goal-behavior tension is decision evidence, not a character judgment. Do not shame the user.",
      "- When an aspirational plan repeatedly conflicts with observed adherence, prefer a realistic design unless the user explicitly wants to test a change.",
      "- Privacy blocks are authoritative. Never reconstruct a blocked category from neighboring context.",
      "- Never invent missing identity, preferences, constraints, or physiological responses."
    );
  }

  if (context?.decisionState) {
    const guidance = String(context.decisionState?.confidenceGuidance || "").trim();
    lines.push(
      "ARI DECISION/CALIBRATION RULES:",
      "- Prior Ari judgments are evidence about Ari's past performance, not facts about the user.",
      "- Current evidence outranks consistency with an old Ari conclusion.",
      "- A previously weakened judgment should increase attention to credible alternatives under similar conditions.",
      guidance ? `- ${guidance}` : "- Do not adjust confidence from historical calibration until the sample is large enough."
    );
  }

  if (context?.communicationLearning) {
    lines.push(
      "COMMUNICATION LEARNING RULES:",
      "- Communication/outcome history is correlational, not proof that a tone or wording caused adherence.",
      "- Current explicit user style instructions always win.",
      "- Never use manipulation, guilt, dependency, or pressure to chase follow-through metrics."
    );
  }

  if (context?.temporalTimeline?.events?.length) {
    lines.push(
      "TEMPORAL TIMELINE RULES:",
      "- Use dated events to resolve before/after/since relationships instead of relying on transcript order.",
      "- Sequence alone does not prove causation.",
      "- When the user references a phase or change, anchor claims to actual dates/events when available."
    );
  }

  if (context?.nutrition?.calorieBudgetPolicy) {
    lines.push(
      "NUTRITION BUDGET RULES:",
      "- Daily food allowance is the saved Daily Calorie Goal minus calories consumed. Exercise calories do not increase food allowance.",
      "- Planned food is not consumed food. Active Meal Plan calories reduce what remains unallocated for planning, but do not count as eaten.",
      "- If Daily Calorie Goal is unknown, keep it unknown. Never substitute a plausible default calorie target."
    );
  }

  return lines.join("\n");
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
    .slice(0, 30);

  if (points.length < 2) return { available: false, latest: points[0]?.value ?? null, change: null, direction: "unknown" };

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
  return /^(why|how|how so|what about|and|but|then|really|you sure|are you sure|what do you mean|explain|tell me more|make it|do that|the other one|instead|okay|ok|yeah|yes|no|nope|track|start|finish|complete|cancel|stop)\b/i.test(text);
}

function needsCurrentInfo(text = "") {
  const value = String(text || "");
  if (PATTERNS.liveInfo.test(value)) return true;
  return PATTERNS.recency.test(value) && PATTERNS.changingReference.test(value);
}

function isCasualConversation({
  message = "",
  followUp = false,
  nutrition = false,
  training = false,
  goals = false,
  social = false,
  memory = false,
  health = false,
  currentInfo = false,
  developer = false
} = {}) {
  const text = String(message || "").trim();
  if (!text || text.length > 140 || followUp) return false;
  if (nutrition || training || goals || social || memory || health || currentInfo || developer) return false;

  return /^(?:(?:hey|hi|hello|yo)(?:\s+ari)?|(?:hey|hi|hello|yo)\s+there|what(?:'s| is)\s+up(?:\s+ari)?|sup(?:\s+ari)?|good\s+(?:morning|afternoon|evening)(?:\s+ari)?|how\s+are\s+you(?:\s+doing)?(?:\s+ari)?|thanks(?:\s+ari)?|thank\s+you(?:\s+ari)?)[!.?\s]*$/i.test(text);
}

function estimateComplexity(message = "") {
  const text = String(message || "");
  if (text.length > 1800) return "deep";
  if (/\b(meal plan|plan my meals|plan the rest|workout plan|build me a workout|make me a workout)\b/i.test(text)) return "standard";
  if (/\b(compare|analyze|review|strategy|why.*and|pros and cons|tradeoff|trend|velocity|plateau|progression|over the last|history|on pace|adjust my program|change my program|experiment|hypothesis)\b/i.test(text)) return "deep";
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