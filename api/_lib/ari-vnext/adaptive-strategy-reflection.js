// ARI vNext — bounded owner-only strategy reflection.
// Produces concise reusable strategy hypotheses, never raw hidden reasoning.

import { normalizeAdaptiveStrategyProposal } from "./adaptive-strategy.js";

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const TIMEOUT_MS = Number(process.env.ARI_ADAPTIVE_STRATEGY_TIMEOUT_MS) > 0
  ? Number(process.env.ARI_ADAPTIVE_STRATEGY_TIMEOUT_MS)
  : 18000;

export async function reflectOnAdaptiveStrategy({
  turn = {},
  result = {},
  adaptiveStrategyState = null
} = {}) {
  const apiKey = clean(process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) return { attempted: false, reason: "missing_openai_key", proposal: null };

  const model = clean(process.env.OPENAI_ARI_ADAPTIVE_STRATEGY_MODEL, 120)
    || clean(result?.provider?.model, 120)
    || clean(result?.modelPolicy?.model, 120)
    || "gpt-5.6";

  const payload = {
    userMessage: clean(turn?.message, 3500),
    ariReply: clean(result?.reply, 5000),
    route: compactRoute(result?.route),
    metacognition: {
      confidence: clean(result?.metacognition?.confidence, 60),
      missingEvidence: compactArray(result?.metacognition?.missingEvidence, 6, 140),
      evidenceSignals: compactArray(result?.metacognition?.evidenceSignals, 6, 140)
    },
    outcomeLearningApplied: Boolean(result?.scientificIntelligence?.outcomeLearning?.applied),
    activeStrategies: (Array.isArray(adaptiveStrategyState?.active) ? adaptiveStrategyState.active : [])
      .slice(0, 6)
      .map((item) => ({
        strategyKey: clean(item?.strategyKey, 100),
        title: clean(item?.title, 120),
        instruction: clean(item?.instruction, 520),
        status: clean(item?.status, 30),
        confidence: finiteOrNull(item?.confidence),
        domains: compactArray(item?.domains, 6, 40)
      }))
  };

  const instructions = [
    "You are Ari's internal adaptive-strategy reflection layer.",
    "Evaluate whether this completed interaction reveals a reusable improvement in HOW Ari reasons, communicates, checks evidence, handles ambiguity, uses memory, or makes recommendations.",
    "Do not output hidden chain-of-thought, private reasoning traces, transcript summaries, secrets, or personal facts about the user as a strategy.",
    "A strategy must be a short generalizable behavior instruction Ari can reuse later. It must not grant application permissions, bypass action confirmation, alter safety boundaries, or claim subjective consciousness.",
    "Do not create a strategy just because a turn happened. Prefer shouldPropose=false unless there is a concrete reusable improvement.",
    "If an active adopted strategy should materially change, propose a NEW strategyKey and set replacesStrategyKey to the old key. Do not silently rewrite an adopted strategy.",
    "Testing strategies are hypotheses. Keep confidence calibrated.",
    "Examples of valid strategy forms: verify changing facts before answering; compare plausible alternatives before high-consequence recommendations; ask one minimal clarifying question only when ambiguity changes the decision; lead with the strongest recommendation when many options would create friction.",
    "Keep strategyKey under 90 characters, title under 120, instruction under 520, rationale under 420, userVisibleSummary under 320, use at most 6 domains, and confidence from 0 to 1. The server validates and clamps these fields before persistence.",
    "Return only the requested JSON object."
  ].join("\n");

  const body = {
    model,
    store: false,
    max_output_tokens: 700,
    reasoning: /^gpt-5|^o[0-9]/i.test(model) ? { effort: "low" } : undefined,
    instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify(payload)
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ari_adaptive_strategy_reflection",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "shouldPropose",
            "strategyKey",
            "title",
            "instruction",
            "rationale",
            "domains",
            "confidence",
            "replacesStrategyKey",
            "userVisibleSummary"
          ],
          properties: {
            shouldPropose: { type: "boolean" },
            strategyKey: { type: "string" },
            title: { type: "string" },
            instruction: { type: "string" },
            rationale: { type: "string" },
            domains: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "general",
                  "conversation",
                  "decision",
                  "evidence",
                  "memory",
                  "coaching",
                  "training",
                  "nutrition",
                  "goals",
                  "health",
                  "social",
                  "developer"
                ]
              }
            },
            confidence: { type: "number" },
            replacesStrategyKey: { type: "string" },
            userVisibleSummary: { type: "string" }
          }
        }
      }
    }
  };
  if (!body.reasoning) delete body.reasoning;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        attempted: true,
        reason: "provider_error",
        proposal: null,
        provider: providerSummary(data, model)
      };
    }

    const parsed = parseJson(extractOutputText(data));
    const proposal = normalizeAdaptiveStrategyProposal(parsed);
    return {
      attempted: true,
      reason: proposal ? "proposal_created" : "no_reusable_strategy",
      proposal,
      provider: providerSummary(data, model)
    };
  } catch (error) {
    return {
      attempted: true,
      reason: error?.name === "AbortError" ? "timeout" : "reflection_failed",
      proposal: null,
      provider: null
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractOutputText(data = {}) {
  const parts = [];
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const content of Array.isArray(item?.content) ? item.content : []) {
      if (content?.type === "output_text" && typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}
function parseJson(value = "") {
  const text = clean(value, 12000);
  if (!text) return null;
  try { return JSON.parse(text); }
  catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }
}
function compactRoute(route = {}) {
  return {
    training: Boolean(route?.training),
    nutrition: Boolean(route?.nutrition),
    goals: Boolean(route?.goals),
    health: Boolean(route?.health),
    social: Boolean(route?.social),
    memory: Boolean(route?.memory),
    currentInfo: Boolean(route?.currentInfo),
    developer: Boolean(route?.developer),
    followUp: Boolean(route?.followUp),
    complexity: clean(route?.complexity, 30)
  };
}
function providerSummary(data = {}, fallbackModel = null) {
  return {
    id: clean(data?.id, 200) || null,
    model: clean(data?.model, 120) || clean(fallbackModel, 120) || null,
    usage: data?.usage && typeof data.usage === "object" ? data.usage : null
  };
}
function compactArray(values, limit, max) {
  return (Array.isArray(values) ? values : []).map((item) => clean(item, max)).filter(Boolean).slice(0, limit);
}
function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
