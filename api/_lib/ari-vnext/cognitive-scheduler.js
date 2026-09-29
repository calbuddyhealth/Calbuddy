import { runAriExperienceCycle } from "./experience-runtime.js";
import { runAriAutonomyCycle } from "./autonomy-runtime.js";
import { runAriDreamingCycle } from "./dreaming-runtime.js";
import { runAriCommunityCycle } from "./community-autonomy.js";
import { runRepairDialogueCycle } from "./chatgpt-repair-dialogue.js";
import { runTheoryDialogueCycle } from "./chatgpt-theory-dialogue.js";
import {
  assertBackgroundAiBudget,
  getBackgroundAiBudgetStatus,
  recordBackgroundOpenAIUsage
} from "../background-ai-budget.js";

export const ARI_COGNITIVE_SCHEDULER_VERSION = "1.0.0";

const RESPONSES_URL =
  process.env.ARI_RESPONSES_URL ||
  process.env.OPENAI_RESPONSES_URL ||
  "https://api.openai.com/v1/responses";

const LANE_CONFIG = {
  repair: { intervalHours: 8, priority: 1.4 },
  autonomy: { intervalHours: 12, priority: 1.3 },
  experience: { intervalHours: 12, priority: 1.0 },
  community: { intervalHours: 12, priority: 0.9 },
  dreaming: { intervalHours: 24, priority: 0.8 },
  theory: { intervalHours: 24, priority: 0.7 }
};

export async function runAriCognitiveScheduler({
  userId,
  now = new Date(),
  route = chooseCognitiveLane
} = {}) {
  const id = clean(userId, 200);
  if (!id) return { success: false, acted: false, reason: "owner_id_missing" };

  const budgetBefore = await getBackgroundAiBudgetStatus({ now });
  if (!budgetBefore.allowed) {
    return {
      success: true,
      acted: false,
      reason: budgetBefore.reason,
      budget: budgetBefore,
      version: ARI_COGNITIVE_SCHEDULER_VERSION
    };
  }

  const history = await loadSchedulerHistory({ userId: id, now }).catch(() => ({}));
  const candidates = buildCandidates({ history, now });
  if (!candidates.length) {
    return {
      success: true,
      acted: false,
      reason: "no_lane_due",
      budget: budgetBefore,
      version: ARI_COGNITIVE_SCHEDULER_VERSION
    };
  }

  const decision = await route({ userId: id, candidates, budget: budgetBefore, now });
  const lane = clean(decision?.lane, 40).toLowerCase();
  if (!lane || lane === "none" || !LANE_CONFIG[lane]) {
    return {
      success: true,
      acted: false,
      reason: clean(decision?.reason, 240) || "scheduler_noop",
      decision,
      budget: budgetBefore,
      version: ARI_COGNITIVE_SCHEDULER_VERSION
    };
  }

  await assertBackgroundAiBudget({ now });
  const result = await runLane({ lane, userId: id, now });
  const budgetAfter = await getBackgroundAiBudgetStatus({ now }).catch(() => budgetBefore);

  return {
    success: result?.success !== false,
    acted: result?.acted === true || result?.dreamed === true,
    lane,
    decision,
    laneResult: result,
    budget: budgetAfter,
    version: ARI_COGNITIVE_SCHEDULER_VERSION
  };
}

export async function chooseCognitiveLane({
  userId,
  candidates = [],
  budget = {},
  now = new Date(),
  fetcher = fetch
} = {}) {
  const apiKey = clean(process.env.ARI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) return deterministicFallback(candidates);

  const model = clean(
    process.env.OPENAI_ARI_COGNITIVE_ROUTER_MODEL ||
    process.env.OPENAI_ARI_BACKGROUND_MODEL ||
    "gpt-5.6-luna",
    160
  );
  const body = {
    model,
    store: false,
    max_output_tokens: 400,
    reasoning: { effort: "low" },
    instructions: [
      "You are Ari's low-cost cognitive scheduler.",
      "Choose at most one background lane for this cycle. The goal is to preserve useful autonomy while minimizing redundant model calls.",
      "Prefer overdue, high-value work. Do not select a lane merely because it exists.",
      "Repair and autonomy may matter more when substantially overdue; dreaming and theory can wait when budget is tight.",
      "Return none when the candidates do not justify provider work.",
      "Do not perform the lane's reasoning yourself. Only route.",
      "Return only the required structured JSON."
    ].join("\n"),
    input: [{
      role: "user",
      content: [{
        type: "input_text",
        text: JSON.stringify({
          now: validIso(now),
          candidates,
          budget: {
            dailySpendUsd: budget?.dailySpendUsd || 0,
            dailyLimitUsd: budget?.dailyLimitUsd || 0,
            monthlySpendUsd: budget?.monthlySpendUsd || 0,
            monthlyLimitUsd: budget?.monthlyLimitUsd || 0
          }
        })
      }]
    }],
    text: {
      format: {
        type: "json_schema",
        name: "ari_cognitive_scheduler",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["lane", "reason"],
          properties: {
            lane: {
              type: "string",
              enum: ["none", "repair", "autonomy", "experience", "community", "dreaming", "theory"]
            },
            reason: { type: "string", maxLength: 240 }
          }
        }
      }
    },
    safety_identifier: clean(userId, 200),
    prompt_cache_key: `ari-cognitive-router:${clean(userId, 36)}`.slice(0, 64)
  };

  let data = null;
  try {
    const response = await fetcher(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });
    data = await response.json().catch(() => ({}));
    if (!response.ok) return deterministicFallback(candidates);
  } catch {
    return deterministicFallback(candidates);
  }

  const parsed = parseJson(extractOutputText(data)) || deterministicFallback(candidates);
  await recordBackgroundOpenAIUsage({
    userId,
    endpoint: "/api/ari-cognitive-cycle",
    requestCategory: "ari_cognitive_scheduler",
    model: data?.model || model,
    responseData: data,
    providerRequestId: data?.id || null,
    metadata: {
      selectedLane: parsed?.lane || "none",
      candidateCount: candidates.length
    }
  }).catch(() => {});

  return parsed;
}

function buildCandidates({ history = {}, now = new Date() } = {}) {
  const nowMs = validDate(now).getTime();
  return Object.entries(LANE_CONFIG)
    .filter(([lane]) => laneEnabled(lane))
    .map(([lane, config]) => {
      const lastAt = history?.[lane] || null;
      const lastMs = Date.parse(String(lastAt || ""));
      const hoursSince = Number.isFinite(lastMs)
        ? Math.max(0, (nowMs - lastMs) / 3600000)
        : 999;
      return {
        lane,
        intervalHours: config.intervalHours,
        hoursSinceLastSelection: round(hoursSince),
        overdueRatio: round(hoursSince / config.intervalHours),
        priority: config.priority
      };
    })
    .filter((item) => item.overdueRatio >= 1)
    .sort((a, b) => (b.overdueRatio * b.priority) - (a.overdueRatio * a.priority));
}

async function loadSchedulerHistory({ userId, now = new Date(), fetcher = fetch } = {}) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return {};
  const since = new Date(validDate(now).getTime() - 7 * 86400000).toISOString();
  const params = new URLSearchParams({
    select: "created_at,metadata",
    user_id: `eq.${userId}`,
    request_category: "eq.ari_cognitive_scheduler",
    created_at: `gte.${since}`,
    order: "created_at.desc",
    limit: "200"
  });
  const response = await fetcher(
    `${process.env.SUPABASE_URL}/rest/v1/ai_provider_usage_logs?${params.toString()}`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  if (!response.ok) return {};
  const rows = await response.json().catch(() => []);
  const history = {};
  for (const row of Array.isArray(rows) ? rows : []) {
    const lane = clean(row?.metadata?.selectedLane, 40).toLowerCase();
    if (!LANE_CONFIG[lane] || history[lane]) continue;
    history[lane] = row?.created_at || null;
  }
  return history;
}

async function runLane({ lane, userId, now }) {
  switch (lane) {
    case "repair":
      return runRepairDialogueCycle({ userId });
    case "autonomy":
      return runAriAutonomyCycle({ userId, now });
    case "experience":
      return runAriExperienceCycle({ userId, now });
    case "community":
      return runAriCommunityCycle({ userId, now });
    case "dreaming":
      return runAriDreamingCycle({ userId, now });
    case "theory":
      return runTheoryDialogueCycle({ userId, now });
    default:
      return { success: true, acted: false, reason: "unknown_lane" };
  }
}

function laneEnabled(lane) {
  const env = {
    repair: process.env.ARI_CHATGPT_REPAIR_DIALOGUE_ENABLED,
    autonomy: process.env.ARI_AUTONOMY_RUNTIME_ENABLED,
    experience: process.env.ARI_EXPERIENCE_ENGINE_ENABLED,
    community: process.env.ARI_AGENT_COMMUNITY_AUTONOMY_ENABLED,
    dreaming: process.env.ARI_DREAMING_ENABLED,
    theory: process.env.ARI_CHATGPT_THEORY_DIALOGUE_ENABLED
  }[lane];
  return String(env ?? "").trim().toLowerCase() !== "false";
}

function deterministicFallback(candidates = []) {
  const first = Array.isArray(candidates) ? candidates[0] : null;
  return first?.lane
    ? { lane: first.lane, reason: "deterministic_overdue_fallback" }
    : { lane: "none", reason: "no_due_lane" };
}
function extractOutputText(data = {}) {
  if (typeof data?.output_text === "string") return data.output_text;
  return (Array.isArray(data?.output) ? data.output : [])
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .map((part) => typeof part?.text === "string" ? part.text : typeof part?.value === "string" ? part.value : "")
    .filter(Boolean)
    .join("\n")
    .trim();
}
function parseJson(value = "") {
  const source = String(value || "").trim();
  if (!source) return null;
  try { return JSON.parse(source); } catch {}
  const first = source.indexOf("{");
  const last = source.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try { return JSON.parse(source.slice(first, last + 1)); } catch {}
  }
  return null;
}
function validDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : new Date();
}
function validIso(value) {
  return validDate(value).toISOString();
}
function round(value) {
  return Math.round((Number(value) || 0) * 1000) / 1000;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
