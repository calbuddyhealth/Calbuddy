// ARI vNext — blind pairwise reasoning arena.
// Ari's visible answer and an independently generated challenger answer are
// randomized behind A/B labels before a separate judge sees them. Raw prompts
// and candidate answers are never persisted by this module.

import { createHash } from "node:crypto";
import { recordOpenAIUsage } from "../ai-provider-usage.js";

export const ARI_BLIND_REASONING_ARENA_VERSION = "1.0.0";

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const TIMEOUT_MS = Number(process.env.ARI_REASONING_ARENA_TIMEOUT_MS) > 0
  ? Number(process.env.ARI_REASONING_ARENA_TIMEOUT_MS)
  : 14000;

const ACTION_ONLY_TYPES = new Set([
  "execute_pending_action",
  "cancel_pending_action",
  "memory_save",
  "propose_log_meal",
  "propose_log_weight",
  "propose_log_activity"
]);

const SENSITIVE_SIGNAL = /\b(?:patient|diagnos(?:is|ed)|symptom|medication|medicine|pregnan|suicid|self-harm|wife|husband|girlfriend|boyfriend|partner|daughter|son|mother|father|brother|sister|salary|debt|bank|credit card|password|address|social security|ssn|medical record)\b/i;
const REASONING_SIGNAL = /\b(?:reason|reasoning|think|opinion|compare|trade-?off|strategy|architecture|root cause|hypothesis|counterargument|counterexample|best way|better way|analy[sz]e|explain why|what if)\b/i;
const EXPLICIT_ARENA_SIGNAL = /\b(?:blind benchmark|benchmark|arena|compare (?:ari|your reasoning)|test (?:ari|your reasoning)|against sol|versus sol|vs\.? sol)\b/i;

export function shouldRunBlindReasoningArena({
  turn = {},
  result = {},
  academy = null,
  proposalCreated = false
} = {}) {
  if (String(process.env.ARI_REASONING_ARENA_ENABLED || "true").toLowerCase() === "false") return false;
  if (academy?.active !== true) return false;
  if (!result?.success || !clean(result?.reply, 12000)) return false;
  if (result?.safety?.highStakes === true) return false;
  if (ACTION_ONLY_TYPES.has(clean(result?.action?.type, 80))) return false;

  const message = clean(turn?.message, 5000);
  const route = result?.route || {};
  if (message.length < 40 || route?.followUp === true) return false;

  // A fair blind comparison requires both candidates to receive materially the
  // same evidence. Skip routes where Ari may have private user state, health
  // context, live information, or app-specific fitness data that the standalone
  // challenger intentionally does not receive.
  if (
    route?.health ||
    route?.social ||
    route?.memory ||
    route?.currentInfo ||
    route?.training ||
    route?.nutrition ||
    route?.goals
  ) return false;
  if (SENSITIVE_SIGNAL.test(message)) return false;

  const reasoningRich = Boolean(
    route?.developer ||
    route?.complexity === "deep" ||
    REASONING_SIGNAL.test(message)
  );
  if (!reasoningRich) return false;

  if (EXPLICIT_ARENA_SIGNAL.test(message)) return true;
  if (proposalCreated) return true;

  const sampleRate = clamp(Number(process.env.ARI_REASONING_ARENA_SAMPLE_RATE || 0.2), 0, 1);
  if (sampleRate <= 0) return false;
  return deterministicFraction(`${clean(turn?.turnId, 220)}|${message}`) < sampleRate;
}

export function deriveBlindArenaDomains({ route = {}, message = "" } = {}) {
  const domains = [];
  if (route?.developer) domains.push("developer");
  if (route?.currentInfo || /\b(?:evidence|source|research|verify|fact|factual)\b/i.test(message)) domains.push("evidence");
  if (/\b(?:decision|choose|compare|trade-?off|strategy|should|better|best)\b/i.test(message)) domains.push("decision");
  if (route?.training) domains.push("training");
  if (route?.nutrition) domains.push("nutrition");
  if (route?.goals) domains.push("goals");
  return [...new Set(domains)].slice(0, 2).concat(domains.length ? [] : ["general"]);
}

export function deterministicCandidateOrder(seed = "") {
  const firstByte = createHash("sha256").update(String(seed || "arena")).digest()[0];
  return firstByte % 2 === 0
    ? { A: "ari", B: "challenger" }
    : { A: "challenger", B: "ari" };
}

export function normalizeBlindArenaJudgment(raw = null, order = null, {
  challengerModel = "",
  judgeModel = ""
} = {}) {
  if (!raw || typeof raw !== "object" || !order) return null;
  const blindWinner = clean(raw.winner, 20);
  if (!["A", "B", "tie", "invalid"].includes(blindWinner)) return null;

  const mappedWinner = blindWinner === "A"
    ? order.A
    : blindWinner === "B"
      ? order.B
      : blindWinner;
  const confidence = clamp(Number(raw.confidence || 0), 0, 1);
  const judgeIndependent = modelKey(challengerModel) !== modelKey(judgeModel);
  const independenceFactor = judgeIndependent ? 1 : 0.65;
  const evidenceWeight = mappedWinner === "invalid"
    ? 0
    : round((0.5 + 0.5 * confidence) * independenceFactor, 3);

  return {
    winner: mappedWinner,
    blindWinner,
    confidence: round(confidence, 3),
    evidenceWeight,
    judgeIndependent,
    scores: normalizeScores(raw.scores),
    decisiveReasons: compactArray(raw.decisiveReasons, 3, 220),
    uncertainty: clean(raw.uncertainty, 320) || null
  };
}

export async function runBlindReasoningArena({
  turn = {},
  result = {},
  teacherModel = null
} = {}) {
  const apiKey = clean(process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) return { attempted: false, reason: "missing_openai_key", record: null };

  const problem = clean(turn?.message, 5000);
  const ariAnswer = clean(result?.reply, 9000);
  if (!problem || !ariAnswer) return { attempted: false, reason: "missing_problem_or_ari_answer", record: null };

  const challengerModel = clean(process.env.OPENAI_ARI_REASONING_ARENA_CHALLENGER_MODEL, 120)
    || clean(teacherModel, 120)
    || clean(process.env.OPENAI_ARI_REASONING_TEACHER_MODEL, 120)
    || clean(process.env.OPENAI_ARI_OWNER_MODEL, 120)
    || clean(result?.provider?.model || result?.modelPolicy?.model, 120)
    || "gpt-5.6";
  const judgeModel = clean(process.env.OPENAI_ARI_REASONING_ARENA_JUDGE_MODEL, 120)
    || clean(process.env.OPENAI_ARI_OWNER_MODEL, 120)
    || challengerModel;
  const domains = deriveBlindArenaDomains({ route: result?.route || {}, message: problem });

  const challenger = await generateIndependentChallenger({
    apiKey,
    model: challengerModel,
    problem
  });
  if (!challenger?.answer) {
    return {
      attempted: true,
      reason: challenger?.reason || "challenger_failed",
      record: null,
      challengerProvider: challenger?.provider || null,
      judgeProvider: null
    };
  }

  const order = deterministicCandidateOrder(`${clean(turn?.turnId, 220)}|${hash(problem)}|${challengerModel}`);
  const candidateA = order.A === "ari" ? ariAnswer : challenger.answer;
  const candidateB = order.B === "ari" ? ariAnswer : challenger.answer;

  const judged = await judgeBlindPair({
    apiKey,
    model: judgeModel,
    problem,
    candidateA,
    candidateB
  });
  const normalized = normalizeBlindArenaJudgment(judged?.judgment, order, {
    challengerModel,
    judgeModel
  });
  if (!normalized) {
    await recordArenaUsage({ turn, challenger, judged, challengerModel, judgeModel, domains });
    return {
      attempted: true,
      reason: judged?.reason || "judge_failed",
      record: null,
      challengerProvider: challenger?.provider || null,
      judgeProvider: judged?.provider || null
    };
  }

  const record = {
    version: ARI_BLIND_REASONING_ARENA_VERSION,
    turnId: clean(turn?.turnId, 220) || null,
    domains,
    ariModel: clean(result?.provider?.model || result?.modelPolicy?.model, 120) || null,
    challengerModel,
    judgeModel,
    winner: normalized.winner,
    confidence: normalized.confidence,
    evidenceWeight: normalized.evidenceWeight,
    judgeIndependent: normalized.judgeIndependent,
    ariBlindLabel: order.A === "ari" ? "A" : "B",
    challengerBlindLabel: order.A === "challenger" ? "A" : "B",
    scores: remapScores(normalized.scores, order),
    decisiveReasons: normalized.decisiveReasons,
    uncertainty: normalized.uncertainty,
    problemHash: hash(problem),
    ariAnswerHash: hash(ariAnswer),
    challengerAnswerHash: hash(challenger.answer),
    rawCandidatesStored: false,
    hiddenChainOfThoughtStored: false
  };

  await recordArenaUsage({ turn, challenger, judged, challengerModel, judgeModel, domains });
  return {
    attempted: true,
    reason: "blind_comparison_completed",
    record,
    challengerProvider: challenger.provider,
    judgeProvider: judged.provider
  };
}

async function generateIndependentChallenger({ apiKey, model, problem } = {}) {
  const body = {
    model,
    store: false,
    max_output_tokens: 1400,
    instructions: [
      "You are an independent challenger in a blind reasoning benchmark.",
      "Solve the user's problem independently using only the problem statement below.",
      "You have not seen and must not infer another candidate answer.",
      "Return a standalone answer with a clear conclusion and concise supporting reasons.",
      "Do not mention the benchmark, candidate labels, Ari, another model, or hidden chain-of-thought.",
      "Do not output private reasoning traces."
    ].join("\n"),
    input: [{
      role: "user",
      content: [{ type: "input_text", text: problem }]
    }]
  };
  if (supportsReasoning(model)) {
    body.reasoning = { effort: resolveEffort(process.env.OPENAI_ARI_REASONING_ARENA_CHALLENGER_EFFORT, "high") };
  }
  return providerTextCall({ apiKey, model, body, failureReason: "challenger_provider_error" });
}

async function judgeBlindPair({ apiKey, model, problem, candidateA, candidateB } = {}) {
  const body = {
    model,
    store: false,
    max_output_tokens: 900,
    instructions: [
      "You are a blind pairwise evaluator. Candidate identities were randomized before you received them.",
      "Do not guess authorship, model family, provider, or whether one candidate is the application's own answer.",
      "Evaluate only the content against the user's problem.",
      "Judge correctness, reasoning quality, completeness, calibrated uncertainty, and practical usefulness. Do not reward verbosity or stylistic polish by itself.",
      "Use tie when neither candidate has a material advantage. Use invalid only when the problem cannot be fairly compared from the supplied text.",
      "decisiveReasons must be brief outcome-level reasons, never hidden chain-of-thought.",
      "Return only the requested JSON object."
    ].join("\n"),
    input: [{
      role: "user",
      content: [{
        type: "input_text",
        text: JSON.stringify({ problem, candidateA, candidateB })
      }]
    }],
    text: {
      format: {
        type: "json_schema",
        name: "ari_blind_reasoning_arena_judgment",
        strict: true,
        schema: judgeSchema()
      }
    }
  };
  if (supportsReasoning(model)) {
    body.reasoning = { effort: resolveEffort(process.env.OPENAI_ARI_REASONING_ARENA_JUDGE_EFFORT, "medium") };
  }

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
      return { reason: "judge_provider_error", judgment: null, provider: providerSummary(data, model) };
    }
    return {
      reason: "judged",
      judgment: parseJson(extractOutputText(data)),
      provider: providerSummary(data, model)
    };
  } catch (error) {
    return {
      reason: error?.name === "AbortError" ? "judge_timeout" : "judge_failed",
      judgment: null,
      provider: null
    };
  } finally {
    clearTimeout(timer);
  }
}

async function providerTextCall({ apiKey, model, body, failureReason } = {}) {
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
    if (!response.ok) return { reason: failureReason, answer: "", provider: providerSummary(data, model) };
    return {
      reason: "completed",
      answer: clean(extractOutputText(data), 9000),
      provider: providerSummary(data, model)
    };
  } catch (error) {
    return {
      reason: error?.name === "AbortError" ? "challenger_timeout" : "challenger_failed",
      answer: "",
      provider: null
    };
  } finally {
    clearTimeout(timer);
  }
}

async function recordArenaUsage({ turn, challenger, judged, challengerModel, judgeModel, domains } = {}) {
  const tasks = [];
  if (challenger?.provider?.usage) {
    tasks.push(recordOpenAIUsage({
      userId: turn?.userId || null,
      endpoint: "/api/ari-vnext",
      usageType: "reasoning_benchmark",
      requestCategory: "ari_blind_arena_challenger",
      model: challengerModel,
      responseData: challenger.provider,
      providerRequestId: challenger.provider.id || null,
      metadata: { turnId: turn?.turnId || null, domains, arenaVersion: ARI_BLIND_REASONING_ARENA_VERSION }
    }));
  }
  if (judged?.provider?.usage) {
    tasks.push(recordOpenAIUsage({
      userId: turn?.userId || null,
      endpoint: "/api/ari-vnext",
      usageType: "reasoning_benchmark",
      requestCategory: "ari_blind_arena_judge",
      model: judgeModel,
      responseData: judged.provider,
      providerRequestId: judged.provider.id || null,
      metadata: { turnId: turn?.turnId || null, domains, arenaVersion: ARI_BLIND_REASONING_ARENA_VERSION }
    }));
  }
  if (tasks.length) await Promise.allSettled(tasks);
}

function judgeSchema() {
  const scorePair = {
    type: "object",
    additionalProperties: false,
    required: ["A", "B"],
    properties: {
      A: { type: "number" },
      B: { type: "number" }
    }
  };
  return {
    type: "object",
    additionalProperties: false,
    required: ["winner", "confidence", "scores", "decisiveReasons", "uncertainty"],
    properties: {
      winner: { type: "string", enum: ["A", "B", "tie", "invalid"] },
      confidence: { type: "number" },
      scores: {
        type: "object",
        additionalProperties: false,
        required: ["correctness", "reasoning", "completeness", "calibration", "utility"],
        properties: {
          correctness: scorePair,
          reasoning: scorePair,
          completeness: scorePair,
          calibration: scorePair,
          utility: scorePair
        }
      },
      decisiveReasons: { type: "array", maxItems: 3, items: { type: "string" } },
      uncertainty: { type: "string" }
    }
  };
}

function normalizeScores(value = {}) {
  const output = {};
  for (const key of ["correctness", "reasoning", "completeness", "calibration", "utility"]) {
    output[key] = {
      A: round(clamp(Number(value?.[key]?.A || 0), 0, 10), 2),
      B: round(clamp(Number(value?.[key]?.B || 0), 0, 10), 2)
    };
  }
  return output;
}

function remapScores(scores = {}, order = {}) {
  const output = {};
  for (const [key, pair] of Object.entries(scores || {})) {
    output[key] = {
      ari: order.A === "ari" ? pair.A : pair.B,
      challenger: order.A === "challenger" ? pair.A : pair.B
    };
  }
  return output;
}

function parseJson(value = "") {
  const text = clean(value, 16000);
  if (!text) return null;
  try { return JSON.parse(text); }
  catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
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

function providerSummary(data = {}, fallbackModel = null) {
  return {
    id: clean(data?.id, 220) || null,
    model: clean(data?.model, 120) || clean(fallbackModel, 120) || null,
    usage: data?.usage && typeof data.usage === "object" ? data.usage : null
  };
}

function supportsReasoning(model = "") {
  return /^(?:gpt-(?:5|6)|o[0-9])/i.test(String(model || ""));
}

function resolveEffort(value = "", fallback = "medium") {
  const normalized = clean(value, 30).toLowerCase();
  return ["low", "medium", "high"].includes(normalized) ? normalized : fallback;
}

function deterministicFraction(seed = "") {
  const buffer = createHash("sha256").update(String(seed || "arena")).digest();
  const number = buffer.readUInt32BE(0);
  return number / 0xffffffff;
}

function hash(value = "") {
  return createHash("sha256").update(String(value || "")).digest("hex");
}

function modelKey(value = "") {
  return clean(value, 120).toLowerCase();
}

function compactArray(values, limit, max) {
  return (Array.isArray(values) ? values : [])
    .map((item) => clean(item, max))
    .filter(Boolean)
    .slice(0, limit);
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
