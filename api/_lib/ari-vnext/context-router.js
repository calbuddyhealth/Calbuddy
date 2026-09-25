// ARI vNext — decide which existing app context is relevant to this turn.
// This is intentionally small. The primary model still owns semantic judgment.

import { advancedConversationInstruction } from "./conversation-contract.js";
import { beliefSystemInstruction } from "./belief-system.js";
import { behavioralIdentityToInstruction } from "./behavioral-identity.js";
import { communicationClosureToInstruction } from "./communication-closure.js";
import { convictionInstruction } from "./conviction-learning.js";
import { dreamingContextToInstruction } from "./dreaming-core.js";\nimport { experienceContextToInstruction } from "./experience-core.js";

export const CONTEXT_ROUTER_VERSION = "1.23.0";

const PATTERNS = {
  nutrition: /\b(calorie|calories|macro|macros|protein|carb|carbs|fat|meal|food|eat|ate|nutrition|breakfast|lunch|dinner|snack|diet|fuel|fueling|hungry|hunger)\b/i,
  training: /\b(workout|training|train|trained|exercise|exercised|lift|lifted|lifting|sets?|reps?|shoulder|chest|back|legs?|arms?|cardio|run|ran|running|jog|jogged|jogging|walk|walked|walking|bike|biked|biking|cycle|cycled|cycling|hike|hiked|hiking|swim|swam|swimming|row|rowed|rowing|elliptical|stairs?|stairmaster|stepmill|push[ -]?ups?|pull[ -]?ups?|burpees?|calisthenics?|basketball|soccer|tennis|gym|strength|rest day|recovery|plateau|pr|personal record|progression|volume|frequency|missed workout|experiment|hypothesis|intervention|observation window)\b/i,
  goals: /\b(goal|weight|cut|bulk|maintain|maintenance|lose|gain|progress|target|bmi|calorie goal|pace|trend|velocity|on pace)\b/i,
  social: /\b(circle|friend|friends|challenge|moment|post|reaction|comment|message|buddy|meet[ -]?ups?|missions?|quests?|crews?|hosting?|hosted|join requests?|open spots?|opportunit(?:y|ies)|activity partner|workout partner|training partner)\b/i,
  memory: /\b(last time|before|remember|you know|again|like last|what did i|what was|what do i prefer|what do i like|what do i dislike|my favorite|my favourite|i prefer|i dislike|from now on|going forward|correction|my wife|my husband|my brother|my sister|my friend)\b/i,
  health: /\b(injury|injured|pain|sore|soreness|medical|medicine|medication|symptom|pregnan|blood pressure|heart rate|doctor|nurse)\b/i,
  liveInfo: /\b(news|weather|forecast|price|prices|score|scores|standings|stock price|market price|exchange rate|release date|availability|president|vice president|prime minister|governor|mayor|senator|representative|congress|supreme court|ceo|cfo|chairman|officeholder|administration|cabinet|election|elections|poll|polls|in office|who is .* president|who's .* president)\b/i,
  recency: /\b(latest|current|currently|today(?:'s)?|tonight|this week|this month|this year|right now|as of now|newest|recent)\b/i,
  changingReference: /\b(research|study|studies|guideline|guidelines|recommendation|recommendations|evidence|software|version|release)\b/i,
  developer: /\b(github|repo|repository|branch|commit|deploy|vercel|supabase|pipeline|runtime|debug|code|javascript|html|css|sql|api|ari(?:'s|\s+(?:xp|rebirth))|reasoning|autonom(?:y|ous)|sentien(?:ce|t)|conviction|learning loop|independent intelligence)\b/i
};

export function routeContext(turn = {}) {
  const message = String(turn?.message || "");
  const followUp = isFollowUp(message);
  const recent = (turn?.history || []).slice(-4).map((item) => item?.content || "").join("\n");
  const semanticText = followUp ? `${recent}\n${message}` : message;
  const account = turn?.context?.accountEntitlements || {};
  const intelligenceEntitlement = turn?.context?.intelligenceEntitlement || null;
  const teenMode = account?.teenMode === true || String(account?.ageBand || "").toLowerCase() === "teen";

  const nutrition = PATTERNS.nutrition.test(semanticText);
  const training = PATTERNS.training.test(semanticText);
  const goals = PATTERNS.goals.test(semanticText);
  const actionNetworkAvailable = turn?.context?.social?.actionNetwork?.available === true;
  const social = PATTERNS.social.test(semanticText) || actionNetworkAvailable;
  const memory = PATTERNS.memory.test(semanticText) || followUp;
  const health = PATTERNS.health.test(semanticText);
  const currentInfo = needsCurrentInfo(semanticText);
  const developer =
    PATTERNS.developer.test(semanticText) ||
    Boolean(turn?.context?.visualInspection) ||
    Boolean(turn?.context?.executionEvidence);
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

  // Persistent memory is protected conversational context. If retrieval or a
  // verified memory action supplied it, keep it model-facing regardless of
  // how much optional cognition/world-model context is also available.
  if (turn?.memory) selected.relevantMemory = String(turn.memory).slice(0, 8000);

  if (source?.memoryCapability && typeof source.memoryCapability === "object") {
    selected.memoryCapability = pickObject(source.memoryCapability, [
      "persistentUserMemory", "explicitRememberSupported", "requestDetected",
      "status", "requestedCount", "storedCount", "failedCount"
    ]);
  }

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

  if (source?.initiativeContext && typeof source.initiativeContext === "object") {
    selected.initiativeContext = source.initiativeContext;
  }

  if (source?.userWorldModel && typeof source.userWorldModel === "object") {
    selected.userWorldModel = source.userWorldModel;
  }

  if (source?.convictionLearning && typeof source.convictionLearning === "object") {
    selected.convictionLearning = source.convictionLearning;
  }

  if (source?.dreaming && typeof source.dreaming === "object" && Array.isArray(source.dreaming.insights)) {
    selected.dreaming = source.dreaming;
  }

  if (source?.experiences && typeof source.experiences === "object" && Array.isArray(source.experiences.experiences)) {
    selected.experiences = source.experiences;
  }

  if (route?.developer && source?.executionEvidence && typeof source.executionEvidence === "object") {
    selected.executionEvidence = source.executionEvidence;
  }

  if (route?.developer && source?.visualInspection && typeof source.visualInspection === "object") {
    selected.visualInspection = source.visualInspection;
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

  if (!route?.casualConversation && source?.decisionState) {
    selected.decisionState = source.decisionState;
  }

  if ((route.training || route.nutrition || route.goals) && source?.communicationLearning) {
    selected.communicationLearning = source.communicationLearning;
  }

  if (!route?.casualConversation && source?.temporalTimeline) {
    selected.temporalTimeline = source.temporalTimeline;
  }

  return selected;
}

export function contextToText(context = {}) {
  try {
    const protectedContext = buildProtectedContext(context);
    const protectedJson = JSON.stringify(protectedContext, null, 2);
    const rules = cognitiveContextRules(context).slice(0, 12000);

    const sectionHeader = "PROTECTED CONTINUITY CONTEXT — preserve and use this before optional cognition:";
    const rulesHeader = "COGNITIVE/BEHAVIOR RULES:";
    const supplementalHeader = "SUPPLEMENTAL CONTEXT:";
    const fixed = [
      sectionHeader,
      protectedJson,
      rules ? rulesHeader : "",
      rules
    ].filter(Boolean).join("\n\n");

    const remaining = Math.max(0, 24000 - fixed.length - supplementalHeader.length - 4);
    const supplementalJson = buildSupplementalContextText(context, remaining);

    return [
      fixed,
      supplementalJson ? supplementalHeader : "",
      supplementalJson
    ].filter(Boolean).join("\n\n");
  } catch {
    return "{}";
  }
}

function buildProtectedContext(context = {}) {
  const output = {};

  if (context.relevantMemory !== undefined) {
    output.relevantMemory = String(context.relevantMemory || "").slice(0, 8000);
  }

  if (context.memoryCapability && typeof context.memoryCapability === "object") {
    output.memoryCapability = pickObject(context.memoryCapability, [
      "persistentUserMemory", "explicitRememberSupported", "requestDetected",
      "status", "requestedCount", "storedCount", "failedCount"
    ]);
  }

  if (context.user !== undefined) output.user = compactContextField("user", context.user);
  if (context.surface !== undefined) output.surface = context.surface;
  if (context.accountEntitlements !== undefined) {
    output.accountEntitlements = compactContextField("accountEntitlements", context.accountEntitlements);
  }
  if (context.intelligenceEntitlement !== undefined) {
    output.intelligenceEntitlement = compactContextField("intelligenceEntitlement", context.intelligenceEntitlement);
  }

  return output;
}

function buildSupplementalContextText(context = {}, maxChars = 0) {
  if (maxChars < 20) return "";

  const protectedKeys = new Set([
    "relevantMemory",
    "memoryCapability",
    "user",
    "surface",
    "accountEntitlements",
    "intelligenceEntitlement"
  ]);
  const priority = [
    "userWorldModel",
    "dreaming",
    "convictionLearning",
    "decisionState",
    "temporalTimeline",
    "institutionalMemory",
    "executionEvidence",
    "visualInspection",
    "agentPerformance"
  ];
  const orderedKeys = [
    ...priority,
    ...Object.keys(context).filter((key) => !priority.includes(key))
  ].filter((key, index, items) => !protectedKeys.has(key) && items.indexOf(key) === index);

  const fitted = {};
  for (const key of orderedKeys) {
    if (context[key] === undefined) continue;
    const candidate = { ...fitted, [key]: compactContextField(key, context[key]) };
    const text = JSON.stringify(candidate, null, 2);
    if (text.length <= maxChars) {
      fitted[key] = candidate[key];
    }
  }

  return Object.keys(fitted).length ? JSON.stringify(fitted, null, 2) : "";
}

function compactContextField(key, value) {
  if (key === "relevantMemory") return String(value || "").slice(0, 9000);
  if (Array.isArray(value)) return value.slice(0, 60);
  if (value && typeof value === "object") {
    try {
      const copy = JSON.parse(JSON.stringify(value));
      if (key === "dreaming" && Array.isArray(copy.insights)) copy.insights = copy.insights.slice(0, 5);
      if (key === "convictionLearning" && Array.isArray(copy.goals)) {
        copy.goals = copy.goals.slice(0, 3);
        while (copy.goals.length > 1 && JSON.stringify(copy).length > 6000) copy.goals.pop();
      }
      if (key === "decisionState" && Array.isArray(copy.recent)) copy.recent = copy.recent.slice(0, 12);
      if (key === "userWorldModel") {
        if (Array.isArray(copy.preferences?.items)) copy.preferences.items = copy.preferences.items.slice(0, 18);
        if (Array.isArray(copy.constraints?.items)) copy.constraints.items = copy.constraints.items.slice(0, 18);

        // sourceSummary is durable telemetry, not primary conversational
        // evidence. Keep compact signals but never let raw curiosity/autonomy
        // traces crowd user memories out of the model prompt.
        if (copy.sourceSummary && typeof copy.sourceSummary === "object") {
          const summary = copy.sourceSummary;
          copy.sourceSummary = {
            profile: summary.profile || null,
            durableMemoryLines: summary.durableMemoryLines ?? null,
            longitudinalTraining: summary.longitudinalTraining || null,
            longitudinalWeight: summary.longitudinalWeight || null,
            experimentOutcomes: summary.experimentOutcomes || null,
            curiosityState: summarizePromptState(summary.curiosityState),
            autonomyRuntime: summarizePromptState(summary.autonomyRuntime)
          };
        }

        if (JSON.stringify(copy).length > 8500 && copy.sourceSummary) {
          copy.sourceSummary = {
            profile: copy.sourceSummary.profile || null,
            durableMemoryLines: copy.sourceSummary.durableMemoryLines ?? null,
            curiosityState: summarizePromptState(copy.sourceSummary.curiosityState),
            autonomyRuntime: summarizePromptState(copy.sourceSummary.autonomyRuntime)
          };
        }
      }
      return copy;
    } catch {
      return {};
    }
  }
  return value;
}

function summarizePromptState(value) {
  if (!value || typeof value !== "object") return value ?? null;
  const summary = {};
  for (const key of [
    "active", "enabled", "mode", "status", "version", "count", "totalCount",
    "questionCount", "activeQuestionCount", "recentCount", "lastUpdatedAt",
    "updatedAt", "lastRunAt"
  ]) {
    if (value[key] !== undefined && value[key] !== null) summary[key] = value[key];
  }
  return Object.keys(summary).length ? summary : { available: true };
}

function cognitiveContextRules(context = {}) {
  const lines = [];
  const conversationInstruction = advancedConversationInstruction(context?.intelligenceEntitlement);

  if (conversationInstruction) {
    lines.push(conversationInstruction);
  }

  if (context?.memoryCapability?.persistentUserMemory === true || context?.relevantMemory) {
    lines.push(
      "CONTINUITY GROUNDING RULES:",
      "- Persistent user memory is available when memoryCapability says it is available. Never claim that Ari lacks persistent memory in that case.",
      "- Resolve pronouns and shorthand such as 'that', 'it', 'she', 'he', 'the thing', or 'what we discussed' from the supplied conversation and relevant memory before answering.",
      "- Never claim to remember, recognize, or know what the user means unless the supplied conversation or relevant memory supports that claim.",
      "- If two materially different referents remain plausible, ask the smallest useful clarification instead of choosing one for conversational smoothness.",
      "- Current explicit user statements outrank conflicting older memories. Treat newer corrections as updates rather than silently selecting an older fact.",
      "- Verified memory-action status is authoritative for whether a requested memory write actually succeeded."
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

  if (context?.initiativeContext?.source === "explicit_ari_signal_engagement") {
    lines.push(
      "ARI SIGNAL ENGAGEMENT RULES:",
      "- The user explicitly opened an Ari Signal. Treat initiativeContext as the grounded subject of the immediate follow-up unless the current user message clearly changes topics.",
      "- For a prediction review, distinguish the original prediction, stored baseline, new observations, evidence quality, preliminary comparison, and final resolution.",
      "- A review date only means the observation window is ready to inspect. It is not evidence that the original prediction was correct.",
      "- preliminaryVerdict is deterministic decision support, not a final judgment. Re-check the actual evidence and material confounders before resolving the prediction.",
      "- If evidence remains sparse or conflicting, say inconclusive rather than forcing supported or weakened.",
      "- Do not claim the decision journal was resolved unless a trusted runtime action or later verified outcome actually records that resolution."
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

  if (context?.visualInspection) {
    lines.push(
      "VISUAL INSPECTION EVIDENCE RULES:",
      "- The supplied Visual Inspector packet is observed browser evidence from ARI XP, not a hypothetical description.",
      "- Use its screenshots/metrics/findings to explain what was actually observed. Do not say Ari cannot see the inspected screen.",
      "- Visual evidence can justify a repository investigation, but it does not prove a source-code cause by itself.",
      "- If a code change is requested, use repository search/read tools and require exact current source evidence before proposing a patch.",
      "- A completed visual inspection is an observation, not proof that a code fix passed."
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

  const cognitiveWorkspace = context?.userWorldModel?.ariCognitiveWorkspace || null;
  const beliefState = cognitiveWorkspace?.beliefSystem || null;
  const beliefInstruction = beliefSystemInstruction(beliefState);
  if (beliefInstruction) lines.push(beliefInstruction);

  const behavioralIdentityInstruction = behavioralIdentityToInstruction(
    cognitiveWorkspace?.behavioralIdentity || null
  );
  if (behavioralIdentityInstruction) lines.push(behavioralIdentityInstruction);

  const closureInstruction = communicationClosureToInstruction(cognitiveWorkspace?.communicationClosure || null);
  if (closureInstruction) lines.push(closureInstruction);

  const dreamingInstruction = dreamingContextToInstruction(context?.dreaming || null);
  if (dreamingInstruction) lines.push(dreamingInstruction);

  const experienceInstruction = experienceContextToInstruction(context?.experiences || null);
  if (experienceInstruction) lines.push(experienceInstruction);

  if (context?.convictionLearning) {
    lines.push(convictionInstruction(context.convictionLearning));
  }

  if (context?.decisionState) {
    const guidance = String(context.decisionState?.confidenceGuidance || "").trim();
    lines.push(
      "ARI DECISION/CALIBRATION RULES:",
      "- Prior Ari judgments are evidence about Ari's past performance, not facts about the user.",
      "- Current evidence outranks consistency with an old Ari conclusion.",
      "- A previously weakened judgment should increase attention to credible alternatives under similar conditions.",
      "- Long-horizon recommendations and predictions remain open until later real-world evidence resolves them. User-reported real outcomes outrank conversational agreement.",
      "- Treat due decisions as review opportunities, not as prompts to force a conclusion. Mixed or inconclusive outcomes should stay mixed or inconclusive.",
      "- Transfer a resolved lesson only when the new context is materially similar; never turn one outcome into a universal rule.",
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
