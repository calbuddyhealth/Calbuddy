// ARI vNext — explicit goal hierarchy and tradeoff reasoning.
// Prevents Ari from pretending every user goal can be maximized simultaneously.

export const ARI_GOAL_HIERARCHY_VERSION = "1.0.1";

const GOALS = [
  { id: "fat_loss", label: "Fat/weight loss", pattern: /\b(lose weight|weight loss|fat loss|cut|cutting|lean(?:er)?|drop weight)\b/i },
  { id: "strength", label: "Strength/performance", pattern: /\b(strength|stronger|performance|lift more|increase (?:my )?(?:bench|squat|deadlift|press)|pr\b|personal record)\b/i },
  { id: "muscle_gain", label: "Muscle gain", pattern: /\b(build muscle|gain muscle|muscle gain|hypertrophy|size|bulk|bulking)\b/i },
  { id: "weight_gain", label: "Weight gain", pattern: /\b(gain weight|weight gain)\b/i },
  { id: "maintenance", label: "Maintenance", pattern: /\b(maintain(?:ing|ance)?(?: weight)?|stay the same weight)\b/i },
  { id: "consistency", label: "Consistency/adherence", pattern: /\b(consisten|adherence|stick to|actually follow|show up|complete my workouts|sustainable)\b/i },
  { id: "recovery", label: "Recovery", pattern: /\b(recovery|recover better|sleep better|less fatigue|less sore|avoid burnout)\b/i },
  { id: "simplicity", label: "Simplicity/time efficiency", pattern: /\b(simple|easy to follow|quick workouts?|short workouts?|save time|time efficient|less complicated)\b/i },
  { id: "flexibility", label: "Lifestyle flexibility", pattern: /\b(flexible|social life|eat out|travel|weekend|schedule flexibility)\b/i }
];

export function deriveGoalHierarchy({ turn = {}, userWorldModel = null, coachingState = null, longitudinalState = null } = {}) {
  const currentText = clean(turn?.message, 1800);
  const stated = Array.isArray(userWorldModel?.goals?.stated) ? userWorldModel.goals.stated : [];
  const current = userWorldModel?.goals?.current && typeof userWorldModel.goals.current === "object"
    ? userWorldModel.goals.current
    : {};
  const corpus = [currentText, ...stated, JSON.stringify(current)].join(" ");

  const explicitPriority = parseExplicitPriority(currentText);
  const candidates = GOALS
    .map((goal) => ({
      id: goal.id,
      label: goal.label,
      mentioned: goal.pattern.test(corpus),
      currentTurnMention: goal.pattern.test(currentText),
      explicitPriority: explicitPriority?.id === goal.id,
      source: explicitPriority?.id === goal.id
        ? "current_user_priority"
        : goal.pattern.test(currentText)
          ? "current_user_statement"
          : goal.pattern.test(stated.join(" "))
            ? "durable_stated_goal"
            : goal.pattern.test(JSON.stringify(current))
              ? "profile_goal"
              : null
    }))
    .filter((item) => item.mentioned || item.explicitPriority);

  const profileGoal = normalizeCoachingGoal(coachingState?.goal);
  if (profileGoal && !candidates.some((item) => item.id === profileGoal)) {
    const def = GOALS.find((item) => item.id === profileGoal);
    candidates.push({ id: profileGoal, label: def?.label || profileGoal, mentioned: true, currentTurnMention: false, explicitPriority: false, source: "coaching_profile" });
  }

  const ranked = candidates
    .map((item) => ({
      ...item,
      priorityScore: item.explicitPriority ? 1 : item.currentTurnMention ? 0.82 : item.source === "durable_stated_goal" ? 0.7 : 0.62
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  const primary = ranked[0] || null;
  const secondary = ranked.slice(1, 4);
  const constraints = Array.isArray(userWorldModel?.constraints?.items) ? userWorldModel.constraints.items.slice(0, 8) : [];
  const tensions = buildTradeoffs({ ranked, constraints, userWorldModel, longitudinalState });

  return {
    version: ARI_GOAL_HIERARCHY_VERSION,
    primary: primary ? compactGoal(primary) : null,
    secondary: secondary.map(compactGoal),
    explicitPriority: Boolean(primary?.explicitPriority),
    hierarchyConfidence: primary?.explicitPriority ? 0.96 : primary ? 0.68 : 0.35,
    constraints,
    tradeoffs: tensions,
    rules: {
      explicitUserPriorityWins: true,
      constraintsAreNotGoals: true,
      doNotPretendAllGoalsCanBeMaximized: true,
      observedAdherenceCanLimitPlanAmbition: true,
      askOnlyWhenPriorityChangesDecision: true
    }
  };
}

export function goalHierarchyToInstruction(state = null) {
  if (!state) return "";
  return [
    "GOAL HIERARCHY & TRADEOFFS",
    "Treat explicit user-ranked priorities as authoritative unless safety requires otherwise.",
    "Do not claim every goal can be maximized at the same time. Name the important tradeoff when a recommendation helps one priority but pressures another.",
    "Constraints are boundaries to design around, not moral failures or hidden goals.",
    "If hierarchy confidence is low and two goals would lead to materially different decisions, ask one concise priority question instead of guessing.",
    "Observed adherence may justify a more realistic plan, but it never erases the user's stated aspiration.",
    JSON.stringify(state, null, 2)
  ].join("\n").slice(0, 6500);
}

function buildTradeoffs({ ranked = [], constraints = [], userWorldModel = null, longitudinalState = null } = {}) {
  const ids = new Set(ranked.map((item) => item.id));
  const tradeoffs = [];
  const behavior = userWorldModel?.behavior || {};
  const adherence = finiteOrNull(longitudinalState?.training?.adherence?.rate ?? behavior?.trainingAdherence);

  if (ids.has("fat_loss") && ids.has("strength")) {
    tradeoffs.push({
      id: "fat_loss_speed_vs_strength_preservation",
      between: ["fat_loss", "strength"],
      summary: "A faster calorie deficit can increase pressure on strength preservation and recovery.",
      decisionRule: "Prefer the user's ranked priority; if unranked, avoid unnecessarily aggressive loss when strength preservation matters.",
      confidence: 0.86
    });
  }
  if (ids.has("fat_loss") && ids.has("muscle_gain")) {
    tradeoffs.push({
      id: "fat_loss_vs_muscle_gain_rate",
      between: ["fat_loss", "muscle_gain"],
      summary: "Fat loss and muscle gain can coexist in some conditions, but aggressively maximizing both is usually a poor planning assumption.",
      decisionRule: "Choose a dominant near-term objective and protect the secondary goal with training/protein/recovery rather than promising maximum progress in both.",
      confidence: 0.82
    });
  }
  if (ids.has("strength") && ids.has("recovery")) {
    tradeoffs.push({
      id: "training_stimulus_vs_recovery_margin",
      between: ["strength", "recovery"],
      summary: "More training stress can support performance only while recovery capacity remains adequate.",
      decisionRule: "Do not add volume merely because strength is a priority when recovery evidence is already pressured.",
      confidence: 0.84
    });
  }
  if ((ids.has("consistency") || ids.has("simplicity")) && adherence !== null && adherence < 0.65) {
    tradeoffs.push({
      id: "plan_ambition_vs_realistic_adherence",
      between: [ids.has("consistency") ? "consistency" : "simplicity", "plan_complexity"],
      summary: `Recent observed training adherence is about ${Math.round(adherence * 100)}%, so a more ambitious plan may produce less completed work in practice.`,
      decisionRule: "Prefer the smallest plan the user can reliably execute unless they explicitly want to test a more ambitious schedule.",
      confidence: 0.78
    });
  }
  if (constraints.some((item) => /\b(time|shift|schedule|work)\b/i.test(item)) && ranked.some((item) => ["strength", "muscle_gain"].includes(item.id))) {
    tradeoffs.push({
      id: "training_ambition_vs_time_constraint",
      between: [ranked.find((item) => ["strength", "muscle_gain"].includes(item.id))?.id || "performance", "time_constraint"],
      summary: "Training ambition must fit the user's actual time/schedule constraint.",
      decisionRule: "Optimize exercise density and frequency before assuming the user can simply add more sessions.",
      confidence: 0.72
    });
  }

  return tradeoffs.slice(0, 6);
}

function parseExplicitPriority(text = "") {
  const patterns = [
    /\b(?:my )?(?:main|primary|top|number one|#1|most important) (?:goal|priority)(?: is|:)?\s+(.+)/i,
    /\b(?:what matters most to me|i care most about)\s+(.+)/i
  ];
  for (const pattern of patterns) {
    const value = clean(text.match(pattern)?.[1], 500);
    if (!value) continue;
    const matches = GOALS
      .map((goal) => {
        const match = value.match(goal.pattern);
        return match ? { goal, index: Number(match.index || 0) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.index - b.index);
    if (matches[0]) return { id: matches[0].goal.id, text: value };
  }
  return null;
}

function normalizeCoachingGoal(value) {
  const text = String(value || "").toLowerCase();
  if (text === "lose") return "fat_loss";
  if (text === "gain") return "weight_gain";
  if (text === "maintain") return "maintenance";
  return null;
}

function compactGoal(item) {
  return { id: item.id, label: item.label, source: item.source, priorityScore: round(item.priorityScore, 2) };
}
function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
