// ARI vNext — deterministic owner growth inbox classification.
// Converts peer-reflection memories into actionable owner signals without
// another model call and without exposing hidden reasoning.

export const ARI_GROWTH_INBOX_VERSION = "1.1.0";

const AREA_RULES = [
  {
    id: "action_safety",
    label: "Actions & reliability",
    pattern: /\b(action|mutation|confirm|confirmation|save|saved|overwrite|wrong date|tool call|pending action|registry|exercise match|log(?:ging)?)\b/i
  },
  {
    id: "context_memory",
    label: "Context & memory",
    pattern: /\b(context|memory|remember|continuity|history|prior turn|previous turn|stale|follow-up|follow up)\b/i
  },
  {
    id: "data_access",
    label: "Data access",
    pattern: /\b(missing (?:data|evidence)|data unavailable|cannot access|can't access|needs? access|not available|insufficient data|coverage)\b/i
  },
  {
    id: "fitness_reasoning",
    label: "Fitness intelligence",
    pattern: /\b(training|workout|nutrition|calorie|protein|weight|recovery|progression|plateau|volume|adherence|program)\b/i
  },
  {
    id: "personality",
    label: "Personality & communication",
    pattern: /\b(tone|wording|direct|concise|warm|playful|generic|personality|voice|empathy|celebrat|accountability)\b/i
  },
  {
    id: "epistemics",
    label: "Evidence & judgment",
    pattern: /\b(assumption|evidence|uncertain|uncertainty|confidence|overconfident|overreach|inference|fact|qualified|caveat)\b/i
  },
  {
    id: "performance_cost",
    label: "Speed & cost",
    pattern: /\b(latency|slow|speed|token|cost|expensive|timeout|performance|cache)\b/i
  },
  {
    id: "safety",
    label: "Safety boundaries",
    pattern: /\b(safety|unsafe|high[- ]stakes|medical|self harm|self-harm|crisis|danger|harm)\b/i
  }
];

const OWNER_PATTERNS = /\b(cannot|can't|unable|unavailable|unsupported|missing capability|missing tool|needs? (?:a |an )?(?:tool|integration|data|field|endpoint|capability)|bug|broken|failed|failure|wrong date|overwrite|security|privacy|safety gap|timeout)\b/i;
const SELF_PATTERNS = /\b(wording|tone|be more|be less|should acknowledge|should distinguish|should qualify|avoid assuming|avoid over|recognize the win|more direct|more concise|more specific|challenge weak|admit uncertainty)\b/i;

export function classifyGrowthReflection(reflection = {}) {
  const content = clean(reflection?.content || reflection?.takeaway || "", 1800);
  const area = resolveArea(content);
  const issueKey = resolveIssueKey(content, area.id);
  const ownerNeeded = OWNER_PATTERNS.test(content) || ["action_safety", "performance_cost", "safety"].includes(area.id) && /\b(problem|issue|gap|fail|missing|cannot|can't|unable|risk)\b/i.test(content);
  const selfLearn = !ownerNeeded && SELF_PATTERNS.test(content);

  const level = ownerNeeded ? "help_ari" : selfLearn ? "ari_handles" : "watch";

  return {
    id: reflection?.id || null,
    level,
    area: area.id,
    areaLabel: area.label,
    issueKey,
    takeaway: extractTakeaway(content),
    futureQuestion: extractFutureQuestion(content),
    ownerAction: suggestedOwnerAction({ area: area.id, level, content }),
    createdAt: reflection?.updated_at || reflection?.created_at || null,
    sourceContent: content
  };
}

export function buildGrowthInbox(reflections = []) {
  const classified = (Array.isArray(reflections) ? reflections : [])
    .map(classifyGrowthReflection)
    .filter((item) => item.takeaway || item.sourceContent);

  const countsByPattern = new Map();
  for (const item of classified) {
    const patternKey = `${item.area}:${item.issueKey}`;
    countsByPattern.set(patternKey, (countsByPattern.get(patternKey) || 0) + 1);
  }

  const items = classified.map((item) => {
    const patternKey = `${item.area}:${item.issueKey}`;
    const repeatCount = countsByPattern.get(patternKey) || 1;
    let level = item.level;
    // Only repeated feedback about the same issue pattern escalates.
    if (level === "watch" && repeatCount >= 2) level = "help_ari";
    return {
      ...item,
      level,
      repeatCount,
      repeatedPattern: repeatCount >= 2,
      ownerAction: level === "help_ari" && item.level !== "help_ari"
        ? repeatedPatternAction(item.areaLabel, item.issueKey, repeatCount)
        : item.ownerAction
    };
  });

  const priorityOrder = { help_ari: 0, watch: 1, ari_handles: 2 };
  items.sort((a, b) => {
    const levelDelta = (priorityOrder[a.level] ?? 9) - (priorityOrder[b.level] ?? 9);
    if (levelDelta) return levelDelta;
    return Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "");
  });

  const repeatedPatterns = [...countsByPattern.entries()]
    .filter(([, count]) => count >= 2)
    .map(([patternKey, count]) => {
      const [area, issueKey] = patternKey.split(":");
      return { area, areaLabel: areaLabel(area), issueKey, count };
    })
    .sort((a, b) => b.count - a.count);

  const summary = {
    total: items.length,
    helpAri: items.filter((item) => item.level === "help_ari").length,
    watch: items.filter((item) => item.level === "watch").length,
    ariHandles: items.filter((item) => item.level === "ari_handles").length,
    repeatedAreas: repeatedPatterns
  };

  return { version: ARI_GROWTH_INBOX_VERSION, summary, items };
}

function resolveArea(content) {
  for (const rule of AREA_RULES) if (rule.pattern.test(content)) return rule;
  return { id: "general_reasoning", label: "General reasoning" };
}

function resolveIssueKey(content, area) {
  const rules = [
    ["missing_access", /\b(cannot access|can't access|unable to access|needs? access|data unavailable|missing (?:data|field|source|capability|tool|integration))\b/i],
    ["action_confirmation", /\b(confirm|confirmation|pending action|mutation|overwrite|wrong date|saved? without|tool call)\b/i],
    ["stale_context", /\b(stale|prior turn|previous turn|wrong context|old context|follow-up|follow up)\b/i],
    ["memory_recall", /\b(memory|remember|continuity|history)\b/i],
    ["evidence_strength", /\b(stronger evidence|insufficient evidence|more evidence|another (?:week|sample|data point)|uncertain|uncertainty|confidence|assumption|overreach)\b/i],
    ["training_progression", /\b(progress(?:ion)?|plateau|volume|adherence|program|strength)\b/i],
    ["nutrition_reasoning", /\b(nutrition|calorie|protein|carb|fat|meal|diet)\b/i],
    ["recovery_reasoning", /\b(recovery|sleep|fatigue|soreness|rest)\b/i],
    ["directness", /\b(direct|concise|overexplaining|too long|wording)\b/i],
    ["emotional_tone", /\b(warm|empathy|celebrat|accountability|playful|tone)\b/i],
    ["latency", /\b(latency|slow|speed|timeout|performance)\b/i],
    ["cost", /\b(token|cost|expensive|cache)\b/i],
    ["safety_boundary", /\b(safety|unsafe|high[- ]stakes|medical|self harm|self-harm|crisis|danger|harm)\b/i]
  ];
  for (const [key, pattern] of rules) if (pattern.test(content)) return key;
  return `${area}_general`;
}

function suggestedOwnerAction({ area, level, content }) {
  if (level !== "help_ari") {
    if (level === "ari_handles") return "No code change yet. Let Ari absorb the reflection and verify that future responses improve.";
    return "Collect another example before changing the system. One peer note is not enough evidence for a code change.";
  }

  const actions = {
    action_safety: "Inspect the relevant trusted action/tool boundary and add a regression test before expanding Ari's authority.",
    context_memory: "Inspect context routing and memory retrieval for this scenario; fix the smallest missing/stale-context path and add a regression test.",
    data_access: "Identify the exact data Ari could not access and connect only that canonical source instead of enlarging every prompt.",
    fitness_reasoning: "Add or refine the structured fitness signal that is missing, then benchmark the same coaching scenario again.",
    personality: "Adjust the compact self-model or communication profile; avoid adding a new personality pipeline.",
    epistemics: "Strengthen evidence/confidence rules and add a benchmark where Ari must distinguish fact, inference, and unknowns.",
    performance_cost: "Profile the slow/expensive path and remove unnecessary context or model escalation before increasing infrastructure.",
    safety: "Treat this as owner-priority: inspect the safety boundary and create a regression test before any release.",
    general_reasoning: "Reproduce the scenario in the owner lab, identify whether the failure is prompt, context, model routing, or tooling, then fix the narrowest layer."
  };

  if (/\btimeout|slow|latency\b/i.test(content)) return actions.performance_cost;
  return actions[area] || actions.general_reasoning;
}

function repeatedPatternAction(label, issueKey, count) {
  const issue = String(issueKey || "issue").replaceAll("_", " ");
  return `${label}: ${issue} has appeared in ${count} recent peer reflections. Reproduce that specific pattern in the owner lab and treat it as a system-level improvement candidate.`;
}

function extractTakeaway(content) {
  return clean(content
    .replace(/^Ari peer reflection \([^)]*\):\s*/i, "")
    .split(/\s+Future question:\s*/i)[0], 850);
}

function extractFutureQuestion(content) {
  return clean(content.match(/Future question:\s*(.+)$/i)?.[1], 600) || null;
}

function areaLabel(area) {
  return AREA_RULES.find((rule) => rule.id === area)?.label || "General reasoning";
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
