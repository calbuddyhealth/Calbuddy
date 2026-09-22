// ARI vNext — server-only durable institutional memory for verified multi-agent lessons.
// Stores compact reusable lessons, never raw specialist transcripts or hidden reasoning.

import { createHash } from "node:crypto";

export const ARI_INSTITUTIONAL_MEMORY_VERSION = "1.0.0";

const TABLE = "ari_vnext_institutional_memory";
const READ_TIMEOUT_MS = 1100;
const WRITE_TIMEOUT_MS = 1200;
const DEFAULT_RETRIEVAL_LIMIT = 3;
const HARD_RETRIEVAL_LIMIT = 5;
const HARD_CANDIDATE_LIMIT = 3;

const SECRET_PATTERN = /\b(password|passcode|pin\b|cvv|security code|api[_ -]?key|access token|refresh token|private key|secret key|seed phrase|recovery phrase|social security|ssn\b|credit card|card number)\b/i;
const HIDDEN_REASONING_PATTERN = /\b(chain[- ]of[- ]thought|hidden reasoning|private reasoning|scratchpad|internal monologue|reasoning trace)\b/i;
const SENSITIVE_USER_PATTERN = /\b(?:user'?s?|my|his|her|their)\b.{0,50}\b(?:diagnos|medication|pregnan|sexual|bank|debt|income|salary|passport|immigration|legal case|home address|phone number|email address|ssn|social security)\b/i;

export async function retrieveInstitutionalMemory({
  userId,
  message = "",
  route = {},
  limit = DEFAULT_RETRIEVAL_LIMIT
} = {}) {
  const id = cleanUserId(userId);
  const enabled = process.env.ARI_INSTITUTIONAL_MEMORY_ENABLED !== "false";
  const ownerOnly = process.env.ARI_INSTITUTIONAL_MEMORY_OWNER_ONLY !== "false";
  const owner = route?.intelligenceEntitlement?.ownerEligible === true;
  const requestedLimit = boundedInt(
    process.env.ARI_INSTITUTIONAL_MEMORY_MAX_RETRIEVAL,
    limit,
    1,
    HARD_RETRIEVAL_LIMIT
  );

  if (!enabled) return emptyRetrieval("disabled");
  if (!id) return emptyRetrieval("missing_user");
  if (ownerOnly && !owner) return emptyRetrieval("owner_only");
  if (route?.casualConversation === true) return emptyRetrieval("casual_turn");

  const rows = await listInstitutionalMemoryRows({
    userId: id,
    limit: 48,
    includeNeedsReview: false
  });
  if (!rows.length) {
    return {
      ...emptyRetrieval("no_lessons"),
      attempted: true,
      active: true
    };
  }

  const scored = rows
    .map((lesson) => ({
      lesson,
      score: relevanceScore({ lesson, message, route })
    }))
    .filter((entry) => entry.score >= 0.12)
    .sort((a, b) =>
      b.score - a.score ||
      Number(b.lesson?.retrievalPriority || 0) - Number(a.lesson?.retrievalPriority || 0) ||
      Date.parse(b.lesson?.updatedAt || 0) - Date.parse(a.lesson?.updatedAt || 0)
    )
    .slice(0, requestedLimit);

  const lessons = scored.map(({ lesson, score }) => ({
    ...lesson,
    relevanceScore: round(score, 3)
  }));

  if (lessons.length) {
    void incrementRetrievalSignals({ userId: id, lessons }).catch(() => {});
  }

  return {
    version: ARI_INSTITUTIONAL_MEMORY_VERSION,
    attempted: true,
    active: true,
    reason: lessons.length ? "relevant_lessons_found" : "no_relevant_lessons",
    retrievedCount: lessons.length,
    lessons,
    hiddenChainOfThoughtStored: false,
    source: "ari_institutional_memory"
  };
}

export function institutionalMemoryToInstruction(memory = null) {
  const lessons = Array.isArray(memory?.lessons) ? memory.lessons.slice(0, HARD_RETRIEVAL_LIMIT) : [];
  if (!memory?.active || !lessons.length) return "";

  const lines = lessons.map((item, index) => {
    const confidence = round(item?.confidence, 2);
    const priority = round(item?.retrievalPriority, 2);
    return [
      `${index + 1}. ${clean(item?.title, 180)}`,
      `   Lesson: ${clean(item?.lesson, 900)}`,
      `   Scope: ${clean(item?.domain, 80) || "general"}; confidence ${confidence}; retrieval priority ${priority}.`
    ].join("\n");
  });

  return [
    "ARI INSTITUTIONAL MEMORY — REUSABLE COUNCIL LESSONS",
    "These are compact lessons distilled from prior verified multi-agent councils. They are strategic evidence, not permanent truth.",
    "Current evidence, explicit user instructions, authoritative app state, safety rules, and verified live information outrank an older lesson.",
    "Do not force a lesson onto a materially different problem. If a lesson conflicts with stronger present evidence, revise or ignore it.",
    "Never treat institutional memory as user memory. Do not infer personal facts about the user from these lessons.",
    "Do not expose or reconstruct hidden chain-of-thought. Only the compact stored lesson may influence the answer.",
    ...lines
  ].join("\n").slice(0, 5600);
}

export async function listInstitutionalMemoryRows({
  userId,
  limit = 48,
  includeNeedsReview = true
} = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  if (!id || !config) return [];

  const params = new URLSearchParams({
    user_id: `eq.${id}`,
    active: "eq.true",
    select: "id,user_id,lesson_key,domain,title,summary,lesson,tags,confidence,novelty,reusability,usefulness,retrieval_priority,evidence_basis,source_turn_id,source_model,retrieval_count,reinforcement_count,conflict_count,active,needs_review,metadata,last_retrieved_at,created_at,updated_at",
    order: "retrieval_priority.desc,updated_at.desc",
    limit: String(Math.max(1, Math.min(80, Number(limit) || 48)))
  });
  if (!includeNeedsReview) params.set("needs_review", "eq.false");

  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.map(normalizeRow).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function scoreInstitutionalLesson(candidate = {}) {
  const normalized = normalizeCandidate(candidate);
  if (!normalized) return { accepted: false, reason: "invalid_candidate", candidate: null };

  const confidence = clamp01(normalized.confidence);
  const novelty = clamp01(normalized.novelty);
  const reusability = clamp01(normalized.reusability);
  const usefulness = clamp01(normalized.usefulness);
  const retrievalPriority = round(
    confidence * 0.40 +
    reusability * 0.30 +
    novelty * 0.15 +
    usefulness * 0.15,
    4
  );

  const minConfidence = boundedFloat(process.env.ARI_INSTITUTIONAL_MEMORY_MIN_CONFIDENCE, 0.68, 0.5, 0.99);
  const minReusability = boundedFloat(process.env.ARI_INSTITUTIONAL_MEMORY_MIN_REUSABILITY, 0.65, 0.5, 0.99);
  const minPriority = boundedFloat(process.env.ARI_INSTITUTIONAL_MEMORY_MIN_PRIORITY, 0.70, 0.5, 0.99);

  const accepted =
    confidence >= minConfidence &&
    reusability >= minReusability &&
    retrievalPriority >= minPriority;

  return {
    accepted,
    reason: accepted ? "threshold_passed" : "below_threshold",
    candidate: {
      ...normalized,
      confidence,
      novelty,
      reusability,
      usefulness,
      retrievalPriority,
      lessonKey: normalized.lessonKey || deriveLessonKey(normalized)
    }
  };
}

export async function persistInstitutionalLessonCandidates({
  userId,
  candidates = [],
  sourceTurnId = null,
  sourceModel = null
} = {}) {
  const id = cleanUserId(userId);
  const config = supabaseConfig();
  const enabled = process.env.ARI_INSTITUTIONAL_MEMORY_ENABLED !== "false";
  const maxCandidates = boundedInt(
    process.env.ARI_INSTITUTIONAL_MEMORY_MAX_NEW_LESSONS,
    HARD_CANDIDATE_LIMIT,
    1,
    HARD_CANDIDATE_LIMIT
  );

  if (!enabled) return emptyPersistence("disabled");
  if (!id || !config) return emptyPersistence("store_unavailable");

  const scored = (Array.isArray(candidates) ? candidates : [])
    .slice(0, maxCandidates)
    .map(scoreInstitutionalLesson);
  const accepted = scored.filter((item) => item.accepted && item.candidate).map((item) => item.candidate);
  if (!accepted.length) {
    return {
      ...emptyPersistence("no_candidates_above_threshold"),
      candidateCount: scored.length,
      rejectedCount: scored.length
    };
  }

  const existing = await listInstitutionalMemoryRows({ userId: id, limit: 80, includeNeedsReview: true });
  let savedCount = 0;
  let reinforcedCount = 0;
  let conflictCount = 0;
  let skippedCount = 0;
  const storedLessons = [];

  for (const candidate of accepted) {
    const related = resolveRelatedLesson(candidate, existing);

    if (candidate.relationship === "conflict" && related) {
      const marked = await patchLesson({
        config,
        userId: id,
        id: related.id,
        patch: {
          needs_review: true,
          conflict_count: Number(related.conflictCount || 0) + 1,
          updated_at: new Date().toISOString()
        }
      });
      if (marked) conflictCount += 1;

      const conflictCandidate = {
        ...candidate,
        needsReview: true
      };
      const created = await insertLesson({
        config,
        userId: id,
        candidate: conflictCandidate,
        sourceTurnId,
        sourceModel
      });
      if (created) {
        savedCount += 1;
        conflictCount += 1;
        storedLessons.push(created);
        existing.push(created);
      } else {
        skippedCount += 1;
      }
      continue;
    }

    if (related) {
      const reinforced = await reinforceLesson({
        config,
        userId: id,
        existing: related,
        candidate,
        sourceTurnId,
        sourceModel
      });
      if (reinforced) {
        reinforcedCount += 1;
        storedLessons.push(reinforced);
        const index = existing.findIndex((item) => item.id === reinforced.id);
        if (index >= 0) existing[index] = reinforced;
      } else {
        skippedCount += 1;
      }
      continue;
    }

    const created = await insertLesson({
      config,
      userId: id,
      candidate,
      sourceTurnId,
      sourceModel
    });
    if (created) {
      savedCount += 1;
      storedLessons.push(created);
      existing.push(created);
    } else {
      skippedCount += 1;
    }
  }

  return {
    version: ARI_INSTITUTIONAL_MEMORY_VERSION,
    attempted: true,
    stored: savedCount > 0 || reinforcedCount > 0 || conflictCount > 0,
    candidateCount: scored.length,
    acceptedCount: accepted.length,
    rejectedCount: scored.length - accepted.length,
    savedCount,
    reinforcedCount,
    conflictCount,
    skippedCount,
    lessons: storedLessons.slice(0, HARD_CANDIDATE_LIMIT),
    hiddenChainOfThoughtStored: false,
    source: "ari_institutional_memory"
  };
}

function resolveRelatedLesson(candidate, existing = []) {
  const explicit = clean(candidate?.relatedLessonKey, 120);
  if (explicit) {
    const direct = existing.find((item) => item.lessonKey === explicit);
    if (direct) return direct;
  }

  const exact = existing.find((item) => item.lessonKey === candidate.lessonKey);
  if (exact) return exact;

  let best = null;
  let bestScore = 0;
  for (const row of existing) {
    if (clean(row?.domain, 80) !== clean(candidate?.domain, 80)) continue;
    const similarity = textSimilarity(
      `${row?.title || ""} ${row?.lesson || ""}`,
      `${candidate?.title || ""} ${candidate?.lesson || ""}`
    );
    if (similarity > bestScore) {
      bestScore = similarity;
      best = row;
    }
  }
  return bestScore >= 0.62 ? best : null;
}

async function reinforceLesson({
  config,
  userId,
  existing,
  candidate,
  sourceTurnId,
  sourceModel
} = {}) {
  const now = new Date().toISOString();
  const patch = {
    title: candidate.title,
    summary: candidate.summary,
    lesson: candidate.lesson,
    tags: uniqueStrings([...(existing.tags || []), ...(candidate.tags || [])], 12, 60),
    confidence: Math.max(Number(existing.confidence || 0), candidate.confidence),
    novelty: Math.max(Number(existing.novelty || 0), candidate.novelty),
    reusability: Math.max(Number(existing.reusability || 0), candidate.reusability),
    usefulness: Math.max(Number(existing.usefulness || 0), candidate.usefulness),
    retrieval_priority: Math.max(Number(existing.retrievalPriority || 0), candidate.retrievalPriority),
    evidence_basis: candidate.evidenceBasis || existing.evidenceBasis || null,
    source_turn_id: clean(sourceTurnId, 220) || existing.sourceTurnId || null,
    source_model: clean(sourceModel, 120) || existing.sourceModel || null,
    reinforcement_count: Number(existing.reinforcementCount || 0) + 1,
    needs_review: false,
    metadata: {
      ...(existing.metadata && typeof existing.metadata === "object" ? existing.metadata : {}),
      lastRelationship: candidate.relationship || "reinforce",
      hiddenChainOfThoughtStored: false
    },
    updated_at: now
  };
  return patchLesson({ config, userId, id: existing.id, patch });
}

async function insertLesson({
  config,
  userId,
  candidate,
  sourceTurnId,
  sourceModel
} = {}) {
  const row = {
    user_id: userId,
    lesson_key: candidate.lessonKey,
    domain: candidate.domain,
    title: candidate.title,
    summary: candidate.summary,
    lesson: candidate.lesson,
    tags: candidate.tags,
    confidence: candidate.confidence,
    novelty: candidate.novelty,
    reusability: candidate.reusability,
    usefulness: candidate.usefulness,
    retrieval_priority: candidate.retrievalPriority,
    evidence_basis: candidate.evidenceBasis || null,
    source_turn_id: clean(sourceTurnId, 220) || null,
    source_model: clean(sourceModel, 120) || null,
    retrieval_count: 0,
    reinforcement_count: candidate.relationship === "reinforce" ? 1 : 0,
    conflict_count: candidate.relationship === "conflict" ? 1 : 0,
    active: true,
    needs_review: candidate.needsReview === true,
    metadata: {
      relationship: candidate.relationship || "new",
      hiddenChainOfThoughtStored: false,
      rawCouncilTranscriptStored: false
    }
  };

  try {
    const params = new URLSearchParams({ on_conflict: "user_id,lesson_key" });
    const response = await timedFetch(`${config.url}/rest/v1/${TABLE}?${params.toString()}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=ignore-duplicates,return=representation" }),
      body: JSON.stringify(row)
    }, WRITE_TIMEOUT_MS);
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    if (response.ok && saved) return normalizeRow(saved);

    const existing = await findLessonByKey({ config, userId, lessonKey: candidate.lessonKey });
    return existing || null;
  } catch {
    return null;
  }
}

async function patchLesson({ config, userId, id, patch } = {}) {
  const safeId = clean(id, 120);
  if (!safeId) return null;
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${TABLE}?id=eq.${encodeURIComponent(safeId)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: serverHeaders(config.key, { Prefer: "return=representation" }),
        body: JSON.stringify(patch)
      },
      WRITE_TIMEOUT_MS
    );
    const data = await response.json().catch(() => []);
    const saved = Array.isArray(data) ? data[0] : data;
    return response.ok && saved ? normalizeRow(saved) : null;
  } catch {
    return null;
  }
}

async function findLessonByKey({ config, userId, lessonKey } = {}) {
  const params = new URLSearchParams({
    user_id: `eq.${userId}`,
    lesson_key: `eq.${lessonKey}`,
    select: "*",
    limit: "1"
  });
  try {
    const response = await timedFetch(
      `${config.url}/rest/v1/${TABLE}?${params.toString()}`,
      { headers: serverHeaders(config.key) },
      READ_TIMEOUT_MS
    );
    if (!response.ok) return null;
    const rows = await response.json().catch(() => []);
    return normalizeRow(Array.isArray(rows) ? rows[0] : rows);
  } catch {
    return null;
  }
}

async function incrementRetrievalSignals({ userId, lessons = [] } = {}) {
  const config = supabaseConfig();
  if (!config) return;
  const now = new Date().toISOString();
  await Promise.all(
    lessons.slice(0, HARD_RETRIEVAL_LIMIT).map((lesson) =>
      patchLesson({
        config,
        userId,
        id: lesson.id,
        patch: {
          retrieval_count: Number(lesson.retrievalCount || 0) + 1,
          last_retrieved_at: now,
          updated_at: now
        }
      })
    )
  );
}

function normalizeCandidate(candidate = {}) {
  const title = clean(candidate?.title, 220);
  const summary = clean(candidate?.summary, 700);
  const lesson = clean(candidate?.lesson, 1200);
  const domain = slug(candidate?.domain || "general", 80) || "general";
  const evidenceBasis = clean(candidate?.evidenceBasis, 800);
  const combined = [title, summary, lesson, evidenceBasis].join(" ");

  if (!title || !summary || !lesson) return null;
  if (SECRET_PATTERN.test(combined) || HIDDEN_REASONING_PATTERN.test(combined) || SENSITIVE_USER_PATTERN.test(combined)) return null;

  const relationshipRaw = clean(candidate?.relationship, 40).toLowerCase();
  const relationship = ["new", "reinforce", "conflict"].includes(relationshipRaw)
    ? relationshipRaw
    : "new";

  return {
    lessonKey: clean(candidate?.lessonKey, 120) || null,
    relatedLessonKey: clean(candidate?.relatedLessonKey, 120) || null,
    domain,
    title,
    summary,
    lesson,
    tags: uniqueStrings(candidate?.tags, 10, 60),
    confidence: clamp01(candidate?.confidence),
    novelty: clamp01(candidate?.novelty),
    reusability: clamp01(candidate?.reusability),
    usefulness: clamp01(candidate?.usefulness),
    evidenceBasis,
    relationship
  };
}

function normalizeRow(row = {}) {
  const id = clean(row?.id, 120);
  const lessonKey = clean(row?.lesson_key, 120);
  if (!id || !lessonKey) return null;
  return {
    id,
    userId: clean(row?.user_id, 200),
    lessonKey,
    domain: clean(row?.domain, 80) || "general",
    title: clean(row?.title, 220),
    summary: clean(row?.summary, 700),
    lesson: clean(row?.lesson, 1200),
    tags: uniqueStrings(row?.tags, 12, 60),
    confidence: clamp01(row?.confidence),
    novelty: clamp01(row?.novelty),
    reusability: clamp01(row?.reusability),
    usefulness: clamp01(row?.usefulness),
    retrievalPriority: clamp01(row?.retrieval_priority),
    evidenceBasis: clean(row?.evidence_basis, 800),
    sourceTurnId: clean(row?.source_turn_id, 220) || null,
    sourceModel: clean(row?.source_model, 120) || null,
    retrievalCount: Math.max(0, Number(row?.retrieval_count || 0)),
    reinforcementCount: Math.max(0, Number(row?.reinforcement_count || 0)),
    conflictCount: Math.max(0, Number(row?.conflict_count || 0)),
    active: row?.active !== false,
    needsReview: row?.needs_review === true,
    metadata: row?.metadata && typeof row.metadata === "object" ? row.metadata : {},
    lastRetrievedAt: clean(row?.last_retrieved_at, 80) || null,
    createdAt: clean(row?.created_at, 80) || null,
    updatedAt: clean(row?.updated_at, 80) || null
  };
}

function relevanceScore({ lesson = {}, message = "", route = {} } = {}) {
  const queryTokens = new Set(tokens(message));
  const lessonTokens = new Set(tokens([
    lesson.title,
    lesson.summary,
    lesson.lesson,
    lesson.domain,
    ...(lesson.tags || [])
  ].join(" ")));

  let overlap = 0;
  for (const token of queryTokens) if (lessonTokens.has(token)) overlap += 1;
  const lexical = queryTokens.size ? overlap / Math.max(3, Math.min(queryTokens.size, 12)) : 0;

  const domains = routeDomains(route);
  const domainMatch = domains.has(lesson.domain) || (lesson.tags || []).some((tag) => domains.has(tag))
    ? 0.28
    : 0;
  const priority = clamp01(lesson.retrievalPriority) * 0.34;
  const confidence = clamp01(lesson.confidence) * 0.12;
  return clamp01(lexical * 0.42 + domainMatch + priority + confidence);
}

function routeDomains(route = {}) {
  const domains = new Set(["general"]);
  if (route.developer) domains.add("developer");
  if (route.currentInfo) domains.add("research");
  if (route.health) domains.add("health");
  if (route.training) domains.add("training");
  if (route.nutrition) domains.add("nutrition");
  if (route.goals) domains.add("goals");
  if (route.social) domains.add("social");
  if (route.memory) domains.add("memory");
  return domains;
}

function deriveLessonKey(candidate = {}) {
  const canonical = [candidate.domain, candidate.title, candidate.lesson]
    .map((value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
    .join("|");
  const hash = createHash("sha256").update(canonical).digest("hex").slice(0, 24);
  return `${slug(candidate.domain || "general", 24) || "general"}_${hash}`;
}

function textSimilarity(a = "", b = "") {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));
  if (!left.size || !right.size) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

function tokens(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3 && !STOP_WORDS.has(item))
    .slice(0, 160);
}

const STOP_WORDS = new Set([
  "the","and","for","that","this","with","from","into","when","then","than","they","them","their",
  "have","has","had","was","were","are","but","not","you","your","user","ari","can","could","should",
  "would","about","what","which","while","where","there","here","using","used","use"
]);

function uniqueStrings(values, limit = 10, max = 60) {
  const source = Array.isArray(values) ? values : [];
  return [...new Set(source.map((item) => slug(item, max)).filter(Boolean))].slice(0, limit);
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function timedFetch(url, options = {}, timeoutMs = 1000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function emptyRetrieval(reason = "inactive") {
  return {
    version: ARI_INSTITUTIONAL_MEMORY_VERSION,
    attempted: false,
    active: false,
    reason,
    retrievedCount: 0,
    lessons: [],
    hiddenChainOfThoughtStored: false,
    source: "ari_institutional_memory"
  };
}

function emptyPersistence(reason = "not_attempted") {
  return {
    version: ARI_INSTITUTIONAL_MEMORY_VERSION,
    attempted: false,
    stored: false,
    reason,
    candidateCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    savedCount: 0,
    reinforcedCount: 0,
    conflictCount: 0,
    skippedCount: 0,
    lessons: [],
    hiddenChainOfThoughtStored: false,
    source: "ari_institutional_memory"
  };
}

function cleanUserId(value = "") {
  const id = clean(value, 200);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : "";
}

function slug(value = "", max = 80) {
  return clean(value, max)
    .toLowerCase()
    .replace(/[^a-z0-9 _-]/g, "")
    .replace(/[ -]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, max);
}

function boundedInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  const candidate = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(min, Math.min(max, candidate));
}

function boundedFloat(value, fallback, min, max) {
  const parsed = Number(value);
  const candidate = Number.isFinite(parsed) ? parsed : fallback;
  return Math.max(min, Math.min(max, candidate));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
