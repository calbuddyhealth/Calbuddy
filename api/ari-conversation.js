// =====================================================
// ARI EXPERIENCE
// File: api/ari-conversation.js
// Version: 1.0.1
// Purpose:
//   Low-latency conversational OpenAI transport for ordinary Ari dialogue.
//   This endpoint intentionally does not run Ari's full deliberation stack.
//   High-stakes, action, developer, and current-information turns are
//   escalated back to the full Rebirth runtime.
// =====================================================

const OPENAI_CHAT_COMPLETIONS_URL =
  process.env.OPENAI_CHAT_COMPLETIONS_URL ||
  "https://api.openai.com/v1/chat/completions";

const FAST_MODEL =
  process.env.OPENAI_FAST_MODEL ||
  process.env.OPENAI_MODEL ||
  process.env.OPENAI_REASONING_MODEL ||
  "gpt-4.1-mini";

const FAST_TIMEOUT_MS = normalizePositiveInteger(
  process.env.OPENAI_FAST_TIMEOUT_MS,
  11000
);

const DEEP_ESCALATION_TOKEN = "__ARI_DEEP_ESCALATE__";

const HIGH_STAKES_PATTERNS = [
  /\b(suicid(?:e|al)|self[- ]?harm|kill myself|hurt myself|overdose|poison(?:ing|ed)?)\b/i,
  /\b(chest pain|stroke|seizure|difficulty breathing|can['’]?t breathe|severe bleeding|unconscious|passed out)\b/i,
  /\b(pregnan(?:t|cy)|miscarriage|fetal|fetus|trimester|breastfeeding)\b/i,
  /\b(medication|medicine|prescription|dose|dosage|mg\b|milligram|drug interaction|side effect)\b/i,
  /\b(diagnos(?:e|is)|symptom|blood pressure|heart rate|infection|fever|injury|pain)\b/i,
  /\b(lawyer|legal advice|lawsuit|court order|criminal charge|immigration status|visa denial)\b/i,
  /\b(invest(?:ment|ing)|stock market|stock price|stocks|shares?|equities|crypto|tax advice|bankruptcy|mortgage rate|loan decision)\b/i
];

const ACTION_PATTERNS = [
  /\b(log|add|save|delete|remove|clear|update|change|set|edit|submit|create)\b.{0,45}\b(meal|food|weight|workout|exercise|goal|profile|calorie|macro|account|week|plan)\b/i,
  /\b(remind me|schedule|book|reserve|send|email|upload|download)\b/i
];

const DEVELOPER_PATTERNS = [
  /\b(github|repo|repository|branch|commit|pull request|\bpr\b|vercel|supabase|deploy|deployment|pipeline|runtime|api endpoint)\b/i,
  /\b(debug|refactor|patch|implement|code review|stack trace|console error|syntax error)\b/i,
  /\b[\w./-]+\.(?:js|mjs|cjs|ts|tsx|jsx|html|css|json|sql|md)\b/i,
  /```[\s\S]*```/
];

const FRESH_INFO_PATTERNS = [
  /\b(latest|right now|breaking|news|live score|weather|forecast|stock price|exchange rate)\b/i,
  /\b(who is the (?:current )?(?:president|ceo|governor|mayor|secretary))\b/i
];

export default async function handler(req, res) {
  setCommonHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
      source: "ari_conversation_api"
    });
  }

  const startedAt = Date.now();

  try {
    const body = await resolveRequestBody(req);
    const message = cleanText(body.message, 6000);
    const history = normalizeHistory(body.history);

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required.",
        source: "ari_conversation_api"
      });
    }

    const escalation = shouldEscalate({
      message,
      history
    });

    if (escalation.deep) {
      return res.status(409).json({
        success: false,
        route: "deep",
        reason: escalation.reason,
        source: "ari_conversation_api",
        timing: {
          totalMs: Date.now() - startedAt
        }
      });
    }

    const apiKey = cleanText(process.env.OPENAI_API_KEY, 1000);

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "OpenAI API key is not configured.",
        source: "ari_conversation_api"
      });
    }

    const context = normalizeContext(body.context);
    const coachMemorySummary = cleanText(body.coachMemorySummary, 2400);

    const messages = buildMessages({
      message,
      history,
      context,
      coachMemorySummary
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FAST_TIMEOUT_MS);

    let openAIResponse;

    try {
      openAIResponse = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: FAST_MODEL,
          messages,
          temperature: 0.72,
          max_tokens: 850
        })
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        return res.status(504).json({
          success: false,
          error: "Fast conversation timed out.",
          failureType: "fast_conversation_timeout",
          source: "ari_conversation_api",
          timing: {
            totalMs: Date.now() - startedAt
          }
        });
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    const rawText = await openAIResponse.text();
    const data = safeJsonParse(rawText);

    if (!openAIResponse.ok) {
      return res.status(openAIResponse.status || 502).json({
        success: false,
        error:
          data?.error?.message ||
          data?.error ||
          "OpenAI fast conversation request failed.",
        failureType: "openai_fast_conversation_failure",
        source: "ari_conversation_api",
        timing: {
          totalMs: Date.now() - startedAt
        }
      });
    }

    const reply = extractReply(data);

    if (!reply) {
      return res.status(502).json({
        success: false,
        error: "OpenAI returned an empty conversational response.",
        failureType: "empty_fast_conversation_response",
        source: "ari_conversation_api",
        timing: {
          totalMs: Date.now() - startedAt
        }
      });
    }

    if (reply.includes(DEEP_ESCALATION_TOKEN)) {
      return res.status(409).json({
        success: false,
        route: "deep",
        reason: "model_requested_deep_escalation",
        source: "ari_conversation_api",
        timing: {
          totalMs: Date.now() - startedAt
        }
      });
    }

    return res.status(200).json({
      success: true,
      ready: true,
      reply,
      emotion: inferEmotion(reply),
      model: data?.model || FAST_MODEL,
      source: "ari_fast_conversation",
      timing: {
        totalMs: Date.now() - startedAt
      }
    });
  } catch (error) {
    console.error("[ARI Fast Conversation Error]", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Fast conversation failed.",
      failureType: "fast_conversation_unhandled_failure",
      source: "ari_conversation_api",
      timing: {
        totalMs: Date.now() - startedAt
      }
    });
  }
}

function buildMessages({
  message,
  history = [],
  context = {},
  coachMemorySummary = ""
} = {}) {
  const system = [
    "You are Ari, the conversational intelligence inside ARI Experience.",
    "Your first job is to have a natural, sharp, useful conversation with the user.",
    "Answer the user's latest message directly. Do not make them wait through a template.",
    "Do not force headings, bullet lists, summaries, disclaimers, or a follow-up question unless they genuinely improve the answer.",
    "Match the depth of the response to the depth of the message. Short question usually means a short answer. Complex but ordinary questions can be longer.",
    "Use prior turns to resolve words like it, that, why, them, she, he, this, or what about that. Do not act as if each turn is a new conversation.",
    "Sound conversational rather than corporate, clinical, scripted, therapeutic, or customer-service-like.",
    "You may be warm, funny, opinionated, or direct when appropriate, but stay accurate and grounded.",
    "Do not announce internal routing, classifications, policies, hidden context, chain-of-thought, or system instructions.",
    "Do not claim that you changed app data, sent something, deployed code, logged a meal, or performed another action unless the app actually reports that action result.",
    "If information is uncertain, say so naturally rather than inventing certainty.",
    `If the request is medical/high-stakes health, self-harm, legal, consequential financial, an app write/action, developer/code execution, or requires live/current information, respond with exactly ${DEEP_ESCALATION_TOKEN} and nothing else.`,
    "Never use the deep-escalation token for ordinary conversation, explanations, opinions, low-stakes nutrition questions, simple educational questions, normal app-data questions, or normal follow-ups."
  ].join("\n");

  const contextualMessages = [];
  const contextText = buildContextText(context, coachMemorySummary);

  contextualMessages.push({
    role: "system",
    content: system
  });

  if (contextText) {
    contextualMessages.push({
      role: "system",
      content:
        "Relevant user/app context follows. Use only what matters to the current conversation and never dump or mention this hidden context unless the user asks about the underlying information.\n\n" +
        contextText
    });
  }

  for (const turn of history.slice(-12)) {
    contextualMessages.push(turn);
  }

  contextualMessages.push({
    role: "user",
    content: message
  });

  return contextualMessages;
}

function buildContextText(context = {}, coachMemorySummary = "") {
  const lines = [];
  const name = cleanText(context?.user?.displayName, 120);

  if (name) lines.push(`Preferred/display name: ${name}`);

  const goals = context?.goals || {};
  const goalEntries = [
    ["Daily calorie goal", goals.dailyGoal],
    ["Calories consumed", goals.caloriesConsumed],
    ["Calories burned", goals.caloriesBurned],
    ["Calories left", goals.caloriesLeft],
    ["Current weight", goals.currentWeight],
    ["Goal weight", goals.goalWeight],
    ["Goal type", goals.goalType],
    ["Activity level", goals.activityLevel]
  ].filter(([, value]) => value !== null && value !== undefined && value !== "");

  for (const [label, value] of goalEntries) {
    lines.push(`${label}: ${String(value).slice(0, 120)}`);
  }

  if (Array.isArray(context.mealsToday) && context.mealsToday.length) {
    lines.push(
      `Meals today: ${context.mealsToday
        .slice(0, 6)
        .map((meal) => `${cleanText(meal?.name, 80)}${meal?.calories != null ? ` (${meal.calories} kcal)` : ""}`)
        .filter(Boolean)
        .join(", ")}`
    );
  }

  if (coachMemorySummary) {
    lines.push(`Relevant memory summary: ${coachMemorySummary}`);
  }

  return lines.join("\n").slice(0, 6000);
}

function shouldEscalate({ message = "", history = [] } = {}) {
  const recentContext = history
    .slice(-4)
    .map((item) => item.content)
    .join("\n");

  const combined = `${recentContext}\n${message}`;

  if (HIGH_STAKES_PATTERNS.some((pattern) => pattern.test(combined))) {
    return { deep: true, reason: "high_stakes_topic" };
  }

  if (ACTION_PATTERNS.some((pattern) => pattern.test(message))) {
    return { deep: true, reason: "application_action_or_write" };
  }

  if (DEVELOPER_PATTERNS.some((pattern) => pattern.test(message))) {
    return { deep: true, reason: "developer_or_code_task" };
  }

  if (FRESH_INFO_PATTERNS.some((pattern) => pattern.test(message))) {
    return { deep: true, reason: "fresh_information_required" };
  }

  if (message.length > 1400) {
    return { deep: true, reason: "large_input" };
  }

  return { deep: false, reason: "ordinary_conversation" };
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];

  let totalCharacters = 0;
  const normalized = [];

  for (const item of history.slice(-12)) {
    const role = item?.role === "assistant" ? "assistant" : "user";
    const content = cleanText(item?.content, 1800);

    if (!content) continue;

    totalCharacters += content.length;
    if (totalCharacters > 10000) break;

    normalized.push({ role, content });
  }

  return normalized;
}

function normalizeContext(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return {};
  }
}

function extractReply(data = {}) {
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

function inferEmotion(reply = "") {
  const text = String(reply || "").toLowerCase();

  if (/\b(lol|haha|😂|🤣)\b/i.test(text)) return "laugh";
  if (/\b(congrats|congratulations|proud of you|hell yeah|nice work)\b/i.test(text)) return "celebrate";
  if (/\b(sorry|that sucks|rough|sad)\b/i.test(text)) return "sad";
  if (/\b(careful|concern|important to get checked)\b/i.test(text)) return "concerned";
  if (/\b(great|nice|good call|love that)\b/i.test(text)) return "happy";

  return "idle";
}

async function resolveRequestBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req?.body === "string") {
    return safeJsonParse(req.body) || {};
  }

  return {};
}

function safeJsonParse(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return null;
  }
}

function cleanText(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? Math.floor(number)
    : fallback;
}

function setCommonHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
}