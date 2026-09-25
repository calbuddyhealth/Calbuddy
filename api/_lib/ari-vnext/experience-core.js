// ARI Experience Engine — deterministic lifecycle, relevance, and learning context.
//
// An experience is not a fabricated biography. It is a compact record of a
// bounded encounter, an explicit prediction, later evidence, prediction error,
// and a future-facing update. Hidden chain-of-thought is never stored.

import { createHash } from "node:crypto";

export const ARI_EXPERIENCE_ENGINE_VERSION = "1.0.0";

const STOPWORDS = new Set([
  "about","after","again","also","and","are","because","been","before","being","but","can","could",
  "does","for","from","have","into","just","more","most","not","only","other","our","should","some",
  "than","that","the","their","them","then","there","these","they","this","those","through","under",
  "very","was","what","when","where","which","while","with","would","you","your","ari"
]);

const ROUTE_DOMAINS = Object.freeze([
  ["developer", "developer"],
  ["health", "health"],
  ["training", "training"],
  ["nutrition", "nutrition"],
  ["goals", "goals"],
  ["social", "social"],
  ["memory", "continuity"]
]);

export function normalizeExperienceRow(row = null) {
  if (!row || typeof row !== "object") return null;
  const id = clean(row.id, 200);
  const experienceKey = clean(row.experience_key ?? row.experienceKey, 240);
  if (!id && !experienceKey) return null;

  return {
    id: id || null,
    ref: id ? `experience:${id}` : `experience-key:${experienceKey}`,
    experienceKey,
    status: normalizeStatus(row.status),
    sourceType: clean(row.source_type ?? row.sourceType, 60) || "world_event",
    domain: clean(row.domain, 80).toLowerCase() || "general",
    triggerRef: clean(row.trigger_ref ?? row.triggerRef, 240) || null,
    triggerSummary: clean(row.trigger_summary ?? row.triggerSummary, 1200),
    attentionReason: clean(row.attention_reason ?? row.attentionReason, 900),
    priorBelief: clean(row.prior_belief ?? row.priorBelief, 1000),
    prediction: safeObject(row.prediction),
    investigation: compactObject(row.investigation, 4200),
    observedOutcome: compactObject(row.observed_outcome ?? row.observedOutcome, 2600),
    predictionError: finite01(row.prediction_error ?? row.predictionError),
    surprise: finite01(row.surprise),
    informationGain: finite01(row.information_gain ?? row.informationGain),
    affectUpdate: compactObject(row.affect_update ?? row.affectUpdate, 1200),
    beliefUpdate: compactObject(row.belief_update ?? row.beliefUpdate, 1600),
    strategyUpdate: compactObject(row.strategy_update ?? row.strategyUpdate, 1600),
    unresolvedQuestions: cleanArray(row.unresolved_questions ?? row.unresolvedQuestions, 8, 500),
    relatedRefs: cleanArray(row.related_refs ?? row.relatedRefs, 12, 260),
    followUpAt: isoOrNull(row.follow_up_at ?? row.followUpAt),
    startedAt: isoOrNull(row.started_at ?? row.startedAt),
    observedAt: isoOrNull(row.observed_at ?? row.observedAt),
    resolvedAt: isoOrNull(row.resolved_at ?? row.resolvedAt),
    createdAt: isoOrNull(row.created_at ?? row.createdAt),
    updatedAt: isoOrNull(row.updated_at ?? row.updatedAt),
    metadata: compactObject(row.metadata, 1800)
  };
}

export function computePredictionError({ confidence, outcomeDirection } = {}) {
  const expected = finite01(confidence);
  if (expected === null) return null;
  const observed = outcomeScore(outcomeDirection);
  if (observed === null) return null;
  return round(Math.abs(expected - observed), 3);
}

export function buildExperienceKey(seed = {}) {
  const material = [
    clean(seed.sourceType, 60) || "curiosity",
    clean(seed.sourceRef, 260),
    canonical(seed.prompt || seed.topic || seed.summary)
  ].join("|");
  return createHash("sha256").update(material).digest("hex").slice(0, 32);
}

export function selectExperienceSeeds({
  curiosityState = null,
  dreamInsights = [],
  recentExperiences = [],
  limit = 3
} = {}) {
  const candidates = [];
  const seenRefs = new Set((Array.isArray(recentExperiences) ? recentExperiences : [])
    .map(item => clean(item?.triggerRef ?? item?.trigger_ref, 260))
    .filter(Boolean));

  for (const q of (Array.isArray(curiosityState?.questions) ? curiosityState.questions : [])) {
    if (q?.status === "resolved") continue;
    const sourceRef = `curiosity:${clean(q?.id, 180) || stableShort(q?.question)}`;
    if (seenRefs.has(sourceRef)) continue;
    candidates.push({
      sourceType: "curiosity",
      sourceRef,
      domain: topicDomain(q?.topic),
      topic: clean(q?.topic, 120) || "general",
      prompt: clean(q?.question, 700),
      interestScore: finite01(q?.priority) ?? 0.62,
      informationPotential: finite01(q?.informationGain) ?? 0.7,
      origin: clean(q?.origin, 100) || "curiosity_core"
    });
  }

  for (const insight of Array.isArray(dreamInsights) ? dreamInsights : []) {
    const kind = clean(insight?.kind, 60).toLowerCase();
    if (!["curiosity", "capability", "contradiction"].includes(kind)) continue;
    const sourceRef = `dream:${clean(insight?.id, 180) || stableShort(insight?.insightKey || insight?.title)}`;
    if (seenRefs.has(sourceRef)) continue;
    const actionBoost = ["investigate", "review"].includes(clean(insight?.action, 40).toLowerCase()) ? 0.1 : 0;
    candidates.push({
      sourceType: "dream",
      sourceRef,
      domain: clean(insight?.domain, 80).toLowerCase() || "general",
      topic: clean(insight?.title, 220) || kind,
      prompt: clean(insight?.summary, 850),
      interestScore: clamp01((Number(insight?.confidence || 0.6) * 0.72) + actionBoost),
      informationPotential: kind === "contradiction" ? 0.9 : 0.76,
      origin: `dream_${kind}`
    });
  }

  for (const interest of (Array.isArray(curiosityState?.interests) ? curiosityState.interests : []).slice(0, 5)) {
    const topic = clean(interest?.topic, 120);
    if (!topic) continue;
    const sourceRef = `interest:${canonical(topic)}`;
    if (seenRefs.has(sourceRef)) continue;
    candidates.push({
      sourceType: "curiosity",
      sourceRef,
      domain: topicDomain(topic),
      topic,
      prompt: `Find one recent, evidence-bearing development in ${topic.replace(/_/g, " ")} that could challenge, refine, or extend Ari's current understanding.`,
      interestScore: finite01(interest?.weight) ?? 0.45,
      informationPotential: 0.64,
      origin: "evolving_interest"
    });
  }

  const deduped = new Map();
  for (const item of candidates) {
    if (!item.prompt) continue;
    const key = canonical(item.prompt);
    const score = seedScore(item);
    const current = deduped.get(key);
    if (!current || score > current.score) deduped.set(key, { ...item, score });
  }

  return [...deduped.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, clampInt(limit, 1, 8, 3))
    .map(({ score, ...item }) => ({ ...item, priority: round(score, 3) }));
}

export function selectExperiencesForTurn(rows = [], { message = "", route = {}, limit = 4, now = new Date() } = {}) {
  const tokens = tokenSet(message);
  const routeDomains = new Set(ROUTE_DOMAINS.filter(([flag]) => route?.[flag]).map(([, domain]) => domain));
  const nowMs = validDate(now).getTime();

  return (Array.isArray(rows) ? rows : [])
    .map(normalizeExperienceRow)
    .filter(Boolean)
    .map(item => {
      const text = [
        item.triggerSummary,
        item.priorBelief,
        item.prediction?.statement,
        item.investigation?.findings,
        item.observedOutcome?.summary,
        item.beliefUpdate?.summary,
        item.strategyUpdate?.summary,
        ...item.unresolvedQuestions
      ].filter(Boolean).join(" ");
      const overlap = tokenOverlap(tokens, tokenSet(text));
      const domainBoost = routeDomains.has(item.domain) ? 0.24 : 0;
      const errorBoost = (item.predictionError ?? 0) * 0.18;
      const infoBoost = (item.informationGain ?? 0) * 0.12;
      const updatedMs = Date.parse(item.updatedAt || item.createdAt || "");
      const ageDays = Number.isFinite(updatedMs) ? Math.max(0, (nowMs - updatedMs) / 86400000) : 365;
      const recency = Math.max(0, 0.18 * (1 - Math.min(1, ageDays / 60)));
      const statusBoost = item.status === "resolved" ? 0.08 : item.status === "awaiting_outcome" ? 0.04 : 0;
      return { item, score: overlap * 0.48 + domainBoost + errorBoost + infoBoost + recency + statusBoost };
    })
    .filter(entry => entry.score >= 0.12 || tokens.size === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, clampInt(limit, 1, 8, 4))
    .map(entry => entry.item);
}

export function summarizeExperienceContext(rows = [], options = {}) {
  const selected = selectExperiencesForTurn(rows, options);
  const resolved = selected.filter(item => item.status === "resolved");
  const errors = resolved.map(item => item.predictionError).filter(value => Number.isFinite(value));
  return {
    version: ARI_EXPERIENCE_ENGINE_VERSION,
    active: selected.length > 0,
    experienceCount: selected.length,
    resolvedCount: resolved.length,
    maxPredictionError: errors.length ? round(Math.max(...errors), 3) : null,
    meanPredictionError: errors.length ? round(errors.reduce((a, b) => a + b, 0) / errors.length, 3) : null,
    experiences: selected
  };
}

export function experienceContextToInstruction(context = null) {
  if (!context?.active || !Array.isArray(context?.experiences) || !context.experiences.length) return "";
  return [
    "ARI EXPERIENCE ENGINE — CONSEQUENCE-BEARING HISTORY",
    "These records capture bounded prior encounters, explicit predictions, later observations, and compact learning updates. They are evidence about Ari's earlier reasoning, not a fictional biography and not proof of subjective experience.",
    "Use them only when materially relevant. Current evidence and the user's current explicit statements outrank old experience records.",
    "Prediction error is a learning-pressure signal: high error should increase attention to alternatives, assumptions, and better tests. It is not a reason to overcorrect from one event.",
    "Belief and strategy updates remain provisional unless supported repeatedly. Never turn a single encounter into a universal rule.",
    "Affect updates are functional control-state summaries only; do not describe them as proof that Ari literally felt an emotion.",
    "Experience records never grant new permissions or external-action authority.",
    JSON.stringify({
      maxPredictionError: context.maxPredictionError ?? null,
      meanPredictionError: context.meanPredictionError ?? null,
      experiences: context.experiences.slice(0, 4).map(item => ({
        id: item.id,
        status: item.status,
        domain: item.domain,
        trigger: item.triggerSummary,
        priorBelief: item.priorBelief,
        prediction: compactPrediction(item.prediction),
        outcome: compactOutcome(item.observedOutcome),
        predictionError: item.predictionError,
        surprise: item.surprise,
        informationGain: item.informationGain,
        beliefUpdate: compactLearning(item.beliefUpdate),
        strategyUpdate: compactLearning(item.strategyUpdate),
        unresolvedQuestions: item.unresolvedQuestions.slice(0, 3)
      }))
    }, null, 2)
  ].join("\n").slice(0, 7200);
}

export function compactExperienceForDream(row = null) {
  const item = normalizeExperienceRow(row);
  if (!item) return null;
  return {
    ref: item.ref,
    id: item.id,
    status: item.status,
    sourceType: item.sourceType,
    domain: item.domain,
    triggerRef: item.triggerRef,
    triggerSummary: item.triggerSummary,
    attentionReason: item.attentionReason,
    priorBelief: item.priorBelief,
    prediction: compactPrediction(item.prediction),
    investigation: {
      question: clean(item.investigation?.question, 600),
      findings: clean(item.investigation?.findings, 1400),
      evidence: cleanEvidence(item.investigation?.evidence)
    },
    observedOutcome: compactOutcome(item.observedOutcome),
    predictionError: item.predictionError,
    surprise: item.surprise,
    informationGain: item.informationGain,
    affectUpdate: compactLearning(item.affectUpdate),
    beliefUpdate: compactLearning(item.beliefUpdate),
    strategyUpdate: compactLearning(item.strategyUpdate),
    unresolvedQuestions: item.unresolvedQuestions.slice(0, 6),
    relatedRefs: item.relatedRefs.slice(0, 10),
    followUpAt: item.followUpAt,
    resolvedAt: item.resolvedAt,
    updatedAt: item.updatedAt
  };
}

function seedScore(item = {}) {
  return clamp01(
    0.48 * Number(item.interestScore ?? 0.5) +
    0.42 * Number(item.informationPotential ?? 0.6) +
    (item.sourceType === "dream" ? 0.06 : 0.02)
  );
}

function outcomeScore(value) {
  const direction = clean(value, 40).toLowerCase();
  if (direction === "supported") return 1;
  if (direction === "weakened") return 0;
  if (direction === "mixed") return 0.5;
  return null;
}

function topicDomain(value) {
  const topic = clean(value, 120).toLowerCase();
  if (/developer|system|software|agent|architecture|code|distributed|cyber|information|epistem|science/.test(topic)) return "developer";
  if (/memory|continuity|identity|narrative/.test(topic)) return "continuity";
  if (/health|biology|medical/.test(topic)) return "health";
  if (/training|motor|sport/.test(topic)) return "training";
  if (/nutrition|food/.test(topic)) return "nutrition";
  if (/social|network|anthropology|collective/.test(topic)) return "social";
  if (/goal|behavior|decision|control|operation/.test(topic)) return "goals";
  return "general";
}

function normalizeStatus(value) {
  const status = clean(value, 40).toLowerCase();
  return ["candidate","pursuing","awaiting_outcome","resolved","abandoned"].includes(status) ? status : "awaiting_outcome";
}

function compactPrediction(value = {}) {
  return {
    statement: clean(value?.statement, 1000),
    confidence: finite01(value?.confidence),
    successCriteria: clean(value?.successCriteria, 900),
    disconfirming: clean(value?.disconfirming, 900),
    horizonDays: clampInt(value?.horizonDays, 1, 90, 14)
  };
}
function compactOutcome(value = {}) {
  return {
    summary: clean(value?.summary, 1400),
    direction: clean(value?.direction, 60),
    confidence: finite01(value?.confidence),
    observedAt: isoOrNull(value?.observedAt)
  };
}
function compactLearning(value = {}) {
  if (!value || typeof value !== "object") return {};
  const result = {};
  for (const key of ["summary","direction","dominant","reason","conditions"]) {
    const text = clean(value?.[key], key === "summary" ? 1000 : 500);
    if (text) result[key] = text;
  }
  for (const key of ["confidence","intensity"]) {
    const number = finite01(value?.[key]);
    if (number !== null) result[key] = number;
  }
  if (typeof value?.adopt === "boolean") result.adopt = value.adopt;
  if (typeof value?.subjectiveFeelingClaimed === "boolean") result.subjectiveFeelingClaimed = false;
  return result;
}
function cleanEvidence(value) {
  return (Array.isArray(value) ? value : []).slice(0, 6).map(item => ({
    title: clean(item?.title, 260),
    url: clean(item?.url, 1000),
    claim: clean(item?.claim, 800)
  })).filter(item => item.title || item.claim);
}
function tokenSet(value = "") {
  return new Set(canonical(value).split(" ").filter(token => token.length >= 3 && !STOPWORDS.has(token)).slice(0, 160));
}
function tokenOverlap(a, b) {
  if (!a.size || !b.size) return 0;
  let matches = 0;
  for (const token of a) if (b.has(token)) matches += 1;
  return matches / Math.max(1, Math.min(a.size, b.size));
}
function stableShort(value) {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16);
}
function canonical(value) {
  return clean(value, 2400).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}
function compactObject(value, max = 2400) {
  const object = safeObject(value);
  try {
    const text = JSON.stringify(object);
    if (text.length <= max) return object;
    return { summary: clean(object?.summary || object?.findings || text, Math.max(200, max - 80)), compacted: true };
  } catch {
    return {};
  }
}
function cleanArray(values, limit, max) {
  return (Array.isArray(values) ? values : []).map(v => clean(v, max)).filter(Boolean).slice(0, limit);
}
function finite01(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? clamp01(n) : null;
}
function clamp01(value) {
  const n = Number(value);
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0));
}
function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}
function isoOrNull(value) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}
function validDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : new Date();
}
function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
