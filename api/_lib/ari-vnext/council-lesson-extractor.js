// ARI vNext — distill reusable institutional lessons from verified multi-agent councils.
// The extractor sees only the compact verified council synthesis and Ari's visible
// final answer. It never receives or persists raw specialist transcripts or hidden reasoning.

import {
  ARI_INSTITUTIONAL_MEMORY_VERSION,
  persistInstitutionalLessonCandidates
} from "./institutional-memory.js";

export const ARI_COUNCIL_LESSON_EXTRACTOR_VERSION = "1.0.0";

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_ARI_INSTITUTIONAL_MEMORY_MODEL || "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 18000;
const MAX_LESSONS = 3;

export async function learnFromCouncilTurn({
  userId,
  turn = {},
  result = {},
  council = null,
  existingLessons = []
} = {}) {
  const extraction = await extractCouncilLessons({
    turn,
    result,
    council,
    existingLessons
  });

  if (!extraction?.attempted || !extraction?.candidates?.length) {
    return {
      version: ARI_COUNCIL_LESSON_EXTRACTOR_VERSION,
      attempted: extraction?.attempted === true,
      reason: extraction?.reason || "no_candidates",
      candidateCount: extraction?.candidateCount || 0,
      savedCount: 0,
      reinforcedCount: 0,
      conflictCount: 0,
      persistence: null,
      provider: extraction?.provider || null,
      hiddenChainOfThoughtStored: false
    };
  }

  const persistence = await persistInstitutionalLessonCandidates({
    userId,
    candidates: extraction.candidates,
    sourceTurnId: turn?.turnId || null,
    sourceModel: extraction?.provider?.model || result?.provider?.model || result?.modelPolicy?.model || null
  });

  return {
    version: ARI_COUNCIL_LESSON_EXTRACTOR_VERSION,
    attempted: true,
    reason: persistence?.stored ? "lessons_persisted" : persistence?.reason || "no_lessons_persisted",
    candidateCount: extraction.candidateCount,
    acceptedCount: persistence?.acceptedCount || 0,
    savedCount: persistence?.savedCount || 0,
    reinforcedCount: persistence?.reinforcedCount || 0,
    conflictCount: persistence?.conflictCount || 0,
    rejectedCount: persistence?.rejectedCount || 0,
    persistence,
    provider: extraction?.provider || null,
    hiddenChainOfThoughtStored: false
  };
}

export async function extractCouncilLessons({
  turn = {},
  result = {},
  council = null,
  existingLessons = []
} = {}) {
  if (process.env.ARI_INSTITUTIONAL_MEMORY_ENABLED === "false") {
    return emptyExtraction("disabled");
  }

  const owner = result?.route?.intelligenceEntitlement?.ownerEligible === true;
  if (process.env.ARI_INSTITUTIONAL_MEMORY_OWNER_ONLY !== "false" && !owner) {
    return emptyExtraction("owner_only");
  }

  if (!result?.multiAgent?.active || !result?.multiAgent?.verifiedSynthesisAvailable) {
    return emptyExtraction("council_not_verified");
  }

  const synthesis = clean(council?.synthesis, 9000);
  const finalReply = clean(result?.reply, 10000);
  const userMessage = clean(turn?.message, 6500);
  if (!synthesis || !finalReply || !userMessage) {
    return emptyExtraction("missing_verified_material");
  }

  const model = clean(DEFAULT_MODEL, 120) || "gpt-4o-mini";
  const existing = (Array.isArray(existingLessons) ? existingLessons : [])
    .slice(0, 8)
    .map((item) => ({
      lessonKey: clean(item?.lessonKey, 120),
      domain: clean(item?.domain, 80),
      title: clean(item?.title, 220),
      lesson: clean(item?.lesson, 900),
      confidence: clamp01(item?.confidence),
      retrievalPriority: clamp01(item?.retrievalPriority)
    }));

  const instructions = [
    "You are Ari's institutional-memory lesson distiller.",
    "Extract at most three durable, reusable lessons from a VERIFIED multi-agent council turn.",
    "Store only compact strategic or methodological lessons that can improve future reasoning, coordination, research, implementation, verification, or communication.",
    "Do NOT store user-specific facts, identity details, health information, finances, relationships, private messages, credentials, secrets, or personal preferences.",
    "Do NOT store current-event facts, prices, officeholders, transient software versions, or other freshness-sensitive claims as durable truth. You may store a reusable method such as 'verify current claims with live sources'.",
    "Do NOT reproduce raw specialist messages, chain-of-thought, hidden reasoning, scratchpads, internal monologues, or reasoning traces.",
    "A lesson should be falsifiable or revisable. Phrase it as a bounded strategy, failure pattern, verification rule, or coordination heuristic rather than an absolute law.",
    "Compare candidates against the provided existing institutional lessons.",
    "relationship must be one of: new, reinforce, conflict.",
    "For reinforce or conflict, set relatedLessonKey to an existing lessonKey when one clearly matches. Otherwise use null.",
    "Scores are decimals from 0 to 1. confidence reflects support from this turn; novelty reflects how new the lesson is; reusability reflects likely cross-turn usefulness; usefulness reflects expected practical value.",
    "Return ONLY valid JSON. No markdown and no commentary.",
    'Schema: {"lessons":[{"domain":"developer|research|reasoning|coordination|verification|communication|general","title":"...","summary":"...","lesson":"...","tags":["..."],"confidence":0.0,"novelty":0.0,"reusability":0.0,"usefulness":0.0,"evidenceBasis":"brief visible evidence basis","relationship":"new|reinforce|conflict","relatedLessonKey":null}]}'
  ].join("\n");

  const input = [{
    role: "user",
    content: [
      `CURRENT USER REQUEST:\n${userMessage}`,
      `VERIFIED COUNCIL SYNTHESIS:\n${synthesis}`,
      `ARI FINAL VISIBLE ANSWER:\n${finalReply}`,
      `EXISTING INSTITUTIONAL LESSONS:\n${JSON.stringify(existing)}`
    ].join("\n\n")
  }];

  let response;
  try {
    response = await callResponses({
      turn,
      model,
      instructions,
      input
    });
  } catch (error) {
    return {
      ...emptyExtraction(error?.name === "AbortError" ? "timeout" : "extractor_failed"),
      attempted: true
    };
  }

  const json = extractJsonObject(extractOutputText(response));
  const rawLessons = Array.isArray(json?.lessons) ? json.lessons.slice(0, MAX_LESSONS) : [];
  const candidates = rawLessons.map(normalizeCandidate).filter(Boolean);

  return {
    version: ARI_COUNCIL_LESSON_EXTRACTOR_VERSION,
    institutionalMemoryVersion: ARI_INSTITUTIONAL_MEMORY_VERSION,
    attempted: true,
    reason: candidates.length ? "candidates_extracted" : "no_valid_candidates",
    candidateCount: candidates.length,
    candidates,
    provider: providerSummary(response, model),
    hiddenChainOfThoughtStored: false,
    rawCouncilTranscriptStored: false
  };
}

async function callResponses({
  turn = {},
  model,
  instructions,
  input
} = {}) {
  const apiKey = clean(process.env.OPENAI_API_KEY, 7000);
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const timeoutMs = boundedInt(
    process.env.ARI_INSTITUTIONAL_MEMORY_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
    6000,
    30000
  );
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const body = {
    model,
    instructions,
    input,
    max_output_tokens: 1300,
    store: false
  };
  if (isReasoningModel(model)) body.reasoning = { effort: "low" };

  if (turn?.userId) {
    const userId = String(turn.userId);
    body.safety_identifier = userId.slice(0, 200);
    body.prompt_cache_key = `ari-institutional:${userId.slice(0, 44)}`.slice(0, 64);
  }

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
      const error = new Error(data?.error?.message || "Ari institutional-memory extraction failed.");
      error.status = response.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeCandidate(value = {}) {
  const domainRaw = clean(value?.domain, 80).toLowerCase();
  const domain = ["developer","research","reasoning","coordination","verification","communication","general"].includes(domainRaw)
    ? domainRaw
    : "general";
  const title = clean(value?.title, 220);
  const summary = clean(value?.summary, 700);
  const lesson = clean(value?.lesson, 1200);
  const evidenceBasis = clean(value?.evidenceBasis, 800);
  if (!title || !summary || !lesson || !evidenceBasis) return null;

  const relationshipRaw = clean(value?.relationship, 40).toLowerCase();
  const relationship = ["new","reinforce","conflict"].includes(relationshipRaw)
    ? relationshipRaw
    : "new";

  return {
    domain,
    title,
    summary,
    lesson,
    tags: uniqueStrings(value?.tags, 10, 60),
    confidence: clamp01(value?.confidence),
    novelty: clamp01(value?.novelty),
    reusability: clamp01(value?.reusability),
    usefulness: clamp01(value?.usefulness),
    evidenceBasis,
    relationship,
    relatedLessonKey: relationship === "new" ? null : clean(value?.relatedLessonKey, 120) || null
  };
}

function extractOutputText(data = {}) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  if (!Array.isArray(data?.output)) return "";
  return data.output
    .filter((item) => item?.type === "message")
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((part) => part?.type === "output_text" && typeof part?.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();
}

function extractJsonObject(text = "") {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const candidates = [
    raw,
    raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")
  ];
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) candidates.push(raw.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // Try the next representation.
    }
  }
  return null;
}

function providerSummary(data = {}, fallbackModel = "") {
  return {
    provider: "openai_responses",
    id: clean(data?.id, 220) || null,
    model: clean(data?.model, 120) || clean(fallbackModel, 120) || null,
    usage: data?.usage || null
  };
}

function emptyExtraction(reason = "not_attempted") {
  return {
    version: ARI_COUNCIL_LESSON_EXTRACTOR_VERSION,
    institutionalMemoryVersion: ARI_INSTITUTIONAL_MEMORY_VERSION,
    attempted: false,
    reason,
    candidateCount: 0,
    candidates: [],
    provider: null,
    hiddenChainOfThoughtStored: false,
    rawCouncilTranscriptStored: false
  };
}

function uniqueStrings(values, limit = 10, max = 60) {
  const source = Array.isArray(values) ? values : [];
  return [...new Set(
    source
      .map((item) => clean(item, max).toLowerCase().replace(/[^a-z0-9 _-]/g, "").replace(/[ -]+/g, "_"))
      .filter(Boolean)
  )].slice(0, limit);
}

function isReasoningModel(value = "") {
  return /^gpt-5|^o[0-9]/i.test(String(value || ""));
}

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  const candidate = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(min, Math.min(max, candidate));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
