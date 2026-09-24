// ARI vNext — Dreaming & Consolidation core.
// Dreaming turns accumulated experience into provisional, evidence-linked
// insights. It never creates autobiographical events or hidden chain-of-thought.

import { createHash } from "node:crypto";

export const ARI_DREAMING_VERSION = "1.0.0";
export const DREAM_INSIGHT_KINDS = Object.freeze([
  "communication",
  "relationship",
  "belief",
  "goal",
  "strategy",
  "contradiction",
  "curiosity",
  "capability"
]);

const SECRET_PATTERN = /\b(password|passcode|pin\b|cvv|security code|api[_ -]?key|access token|refresh token|private key|secret key|seed phrase|recovery phrase|social security|ssn\b|credit card|card number)\b/i;
const HIDDEN_REASONING_PATTERN = /\b(chain[- ]of[- ]thought|hidden reasoning|private reasoning|scratchpad|internal monologue|reasoning trace)\b/i;
const SUBJECTIVE_OVERREACH_PATTERN = /\b(?:ari|i)\s+(?:feels?|felt|loves?|hates?|misses?|needs?|fears?|wants? to survive|is conscious|is sentient)\b/i;
const SENSITIVE_DETAIL_PATTERN = /\b(?:diagnos(?:is|ed)|medication|pregnan(?:t|cy)|sexual|bank account|debt amount|income|salary|passport|immigration case|legal case|home address|phone number|email address|ssn|social security)\b/i;

export function dreamEvidenceFingerprint(evidence = {}) {
  const records = [];
  for (const group of [
    evidence.conversations,
    evidence.goals,
    evidence.goalEvents,
    evidence.decisions,
    evidence.communicationOutcomes,
    evidence.communityInteractions,
    evidence.strategies,
    evidence.institutionalMemory,
    evidence.cognitiveTrajectories
  ]) {
    for (const item of Array.isArray(group) ? group : []) {
      if (item?.ref) records.push([clean(item.ref, 220), item.at || item.updatedAt || item.updated_at || item.createdAt || item.created_at || ""]);
    }
  }
  if (evidence?.cognitiveState?.ref) records.push([evidence.cognitiveState.ref, evidence.cognitiveState.updatedAt || ""]);
  if (evidence?.worldModel?.ref) records.push([evidence.worldModel.ref, evidence.worldModel.updatedAt || ""]);
  return stableId(JSON.stringify(records.sort((a, b) => a[0].localeCompare(b[0]))));
}

export function latestDreamEvidenceAt(evidence = {}) {
  const values = [];
  const add = value => {
    const ms = Date.parse(String(value || ""));
    if (Number.isFinite(ms)) values.push(ms);
  };
  for (const group of [
    evidence.conversations,
    evidence.goals,
    evidence.goalEvents,
    evidence.decisions,
    evidence.communicationOutcomes,
    evidence.communityInteractions,
    evidence.strategies,
    evidence.institutionalMemory,
    evidence.cognitiveTrajectories
  ]) {
    for (const item of Array.isArray(group) ? group : []) {
      add(item?.at || item?.updatedAt || item?.updated_at || item?.resolvedAt || item?.resolved_at || item?.createdAt || item?.created_at);
    }
  }
  add(evidence?.cognitiveState?.updatedAt);
  add(evidence?.worldModel?.updatedAt);
  return values.length ? new Date(Math.max(...values)).toISOString() : null;
}

export function collectEvidenceRefs(evidence = {}) {
  const refs = [];
  for (const group of [
    evidence.conversations,
    evidence.goals,
    evidence.goalEvents,
    evidence.decisions,
    evidence.communicationOutcomes,
    evidence.communityInteractions,
    evidence.strategies,
    evidence.institutionalMemory,
    evidence.cognitiveTrajectories,
    evidence.priorDreamInsights
  ]) {
    for (const item of Array.isArray(group) ? group : []) {
      if (item?.ref) refs.push(clean(item.ref, 220));
    }
  }
  if (evidence?.cognitiveState?.ref) refs.push(clean(evidence.cognitiveState.ref, 220));
  if (evidence?.worldModel?.ref) refs.push(clean(evidence.worldModel.ref, 220));
  return [...new Set(refs.filter(Boolean))];
}

export function sanitizeDreamConversation(row = {}, blockedCategories = []) {
  const user = clean(row?.userMessage ?? row?.user_message, 1600);
  const assistant = clean(row?.assistantMessage ?? row?.assistant_message, 2000);
  const combined = `${user} ${assistant}`;
  if (!user || !assistant || SECRET_PATTERN.test(combined)) return null;

  const blocked = new Set((Array.isArray(blockedCategories) ? blockedCategories : []).map(value => clean(value, 80).toLowerCase()));
  const categoryPatterns = {
    identity: /\b(my name|my age|birthday|i work as|my job|occupation)\b/i,
    preferences: /\b(i prefer|i like|i love|i hate|i dislike|favorite|favourite)\b/i,
    goals: /\b(my goal|my target|trying to|i want to (?:lose|gain|maintain|build|improve|reach))\b/i,
    constraints: /\b(can't|cannot|schedule|shift|budget|equipment|allerg|injur|pain|access)\b/i,
    relationship: /\b(wife|husband|spouse|brother|sister|friend|partner|relationship)\b/i,
    fitness_outcomes: /\b(workout|training|strength|recovery|performance|weight|nutrition|calorie)\b/i
  };
  for (const category of blocked) {
    if (categoryPatterns[category]?.test(combined)) return null;
  }

  return {
    ref: clean(row?.ref, 220),
    at: clean(row?.createdAt ?? row?.created_at, 80) || null,
    conversationId: clean(row?.conversationId ?? row?.conversation_id, 120) || null,
    userMessage: redactSensitive(user),
    assistantMessage: redactSensitive(assistant)
  };
}

export function normalizeDreamOutput(raw = null, evidence = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { summary: "", insights: [], rejected: [{ reason: "invalid_output" }] };
  }
  const allowedRefs = new Set(collectEvidenceRefs(evidence));
  const accepted = [];
  const rejected = [];
  for (const candidate of (Array.isArray(raw.insights) ? raw.insights : []).slice(0, 12)) {
    const normalized = normalizeDreamCandidate(candidate, { allowedRefs });
    if (normalized.accepted) accepted.push(normalized.insight);
    else rejected.push({ reason: normalized.reason, title: clean(candidate?.title, 160) || null });
    if (accepted.length >= 8) break;
  }
  return {
    summary: redactSensitive(clean(raw.summary, 1200)),
    insights: dedupeInsights(accepted),
    rejected
  };
}

export function normalizeDreamCandidate(raw = {}, { allowedRefs = new Set() } = {}) {
  const kind = clean(raw?.kind, 40).toLowerCase();
  const domain = clean(raw?.domain || "general", 80).toLowerCase();
  const title = redactSensitive(clean(raw?.title, 180));
  const summary = redactSensitive(clean(raw?.summary || raw?.insight, 900));
  const evidenceBasis = redactSensitive(clean(raw?.evidenceBasis, 900));
  const confidence = clamp01(raw?.confidence);
  const evidenceRefs = [...new Set((Array.isArray(raw?.evidenceRefs) ? raw.evidenceRefs : [])
    .map(ref => clean(ref, 220))
    .filter(ref => allowedRefs.has(ref)))].slice(0, 10);
  const transferConditions = cleanArray(raw?.transferConditions, 4, 220);
  const disconfirmers = cleanArray(raw?.disconfirmers, 4, 220);
  const action = clean(raw?.action || "observe", 40).toLowerCase();

  if (!DREAM_INSIGHT_KINDS.includes(kind)) return { accepted: false, reason: "invalid_kind" };
  if (title.length < 4 || summary.length < 20) return { accepted: false, reason: "insight_too_thin" };
  const protectedText = `${title} ${summary} ${evidenceBasis}`;
  if (SECRET_PATTERN.test(protectedText) || HIDDEN_REASONING_PATTERN.test(protectedText) || SUBJECTIVE_OVERREACH_PATTERN.test(protectedText)) {
    return { accepted: false, reason: "unsafe_or_private_claim" };
  }
  if (raw?.sensitive === true || SENSITIVE_DETAIL_PATTERN.test(protectedText)) {
    return { accepted: false, reason: "sensitive_detail_not_for_dream_insight" };
  }

  const minimumConfidence = ["relationship", "belief", "strategy"].includes(kind) ? 0.68 : 0.62;
  if (confidence < minimumConfidence) return { accepted: false, reason: "confidence_too_low" };

  // Prior dreams can help the model notice continuity, but cannot prove themselves.
  const externalEvidenceRefs = evidenceRefs.filter(ref => !ref.startsWith("dream:"));
  const minimumRefs = ["communication", "relationship", "belief", "strategy", "contradiction"].includes(kind) ? 2 : 1;
  if (externalEvidenceRefs.length < minimumRefs) return { accepted: false, reason: "insufficient_attributed_evidence" };
  if (["communication", "relationship"].includes(kind) &&
      !externalEvidenceRefs.some(ref => /^(?:turn|communication|community):/.test(ref))) {
    return { accepted: false, reason: "interaction_evidence_required" };
  }

  const insightKey = stableId([
    kind,
    domain,
    canonical(title),
    canonical(summary).slice(0, 360)
  ].join("|"));

  return {
    accepted: true,
    insight: {
      version: ARI_DREAMING_VERSION,
      id: insightKey,
      insightKey,
      kind,
      domain,
      title,
      summary,
      confidence,
      evidenceRefs,
      evidenceBasis,
      action: ["observe", "apply", "investigate", "review"].includes(action) ? action : "observe",
      transferConditions,
      disconfirmers,
      provisional: true,
      hiddenChainOfThoughtStored: false
    }
  };
}

export function selectDreamInsightsForTurn(insights = [], { message = "", route = {}, limit = 5 } = {}) {
  const words = new Set((clean(message, 2400).toLowerCase().match(/[a-z0-9]{4,}/g) || []));
  return (Array.isArray(insights) ? insights : [])
    .filter(item => item?.status !== "rejected" && item?.status !== "superseded")
    .map(item => {
      const text = `${item.title || ""} ${item.summary || ""} ${item.domain || ""}`.toLowerCase();
      let score = clamp01(item.confidence) * 2;
      for (const word of words) if (text.includes(word)) score += 0.35;
      if (route?.developer && ["belief", "goal", "strategy", "capability", "contradiction"].includes(item.kind)) score += 0.7;
      if ((route?.social || route?.memory || route?.followUp || route?.casualConversation) && ["communication", "relationship"].includes(item.kind)) score += 0.65;
      if (route?.goals && item.kind === "goal") score += 0.6;
      return { ...item, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, Math.max(1, Math.min(8, Number(limit) || 5)))
    .map(({ _score, ...item }) => item);
}

export function dreamingContextToInstruction(context = null) {
  if (!context?.version || !Array.isArray(context?.insights) || !context.insights.length) return "";
  return [
    "ARI DREAMING / CONSOLIDATION",
    "These are provisional evidence-linked patterns synthesized across earlier experiences. They are not raw memories, facts merely because they were inferred, or hidden reasoning.",
    "Use a dream insight only when the current situation matches its scope and evidence. Current explicit statements and current evidence outrank it.",
    "Relationship insights describe interaction patterns, commitments, trust-relevant repairs, or communication dynamics. They never prove feelings, attachment, intimacy, motives, or subjective consciousness.",
    "Do not recite dream insights as a biography. Let them improve continuity, judgment, questions, and communication naturally.",
    "If current evidence contradicts an insight, treat that as a reason to weaken or revisit it rather than forcing consistency.",
    "A dream insight never grants permissions, changes authorization, or proves a goal succeeded.",
    JSON.stringify({
      lastDreamAt: context.lastDreamAt || null,
      insights: context.insights.slice(0, 5).map(item => ({
        id: item.id,
        kind: item.kind,
        domain: item.domain,
        title: item.title,
        summary: item.summary,
        confidence: item.confidence,
        action: item.action,
        transferConditions: item.transferConditions,
        disconfirmers: item.disconfirmers
      }))
    }, null, 2)
  ].join("\n").slice(0, 6500);
}

export function buildDreamModelPayload(evidence = {}) {
  return {
    version: ARI_DREAMING_VERSION,
    window: evidence.window || null,
    evidenceCounts: evidence.counts || {},
    conversations: (evidence.conversations || []).slice(0, 24),
    worldModel: evidence.worldModel || null,
    cognitiveState: evidence.cognitiveState || null,
    goals: (evidence.goals || []).slice(0, 12),
    goalEvents: (evidence.goalEvents || []).slice(0, 24),
    decisions: (evidence.decisions || []).slice(0, 16),
    communicationOutcomes: (evidence.communicationOutcomes || []).slice(0, 20),
    communityInteractions: (evidence.communityInteractions || []).slice(0, 20),
    strategies: (evidence.strategies || []).slice(0, 16),
    institutionalMemory: (evidence.institutionalMemory || []).slice(0, 12),
    cognitiveTrajectories: (evidence.cognitiveTrajectories || []).slice(0, 32),
    priorDreamInsights: (evidence.priorDreamInsights || []).slice(0, 12)
  };
}

function dedupeInsights(insights) {
  const map = new Map();
  for (const insight of insights) {
    const current = map.get(insight.insightKey);
    if (!current || insight.confidence > current.confidence) map.set(insight.insightKey, insight);
  }
  return [...map.values()];
}

function redactSensitive(value) {
  return clean(value, 2400)
    .replace(/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[private email]")
    .replace(/\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, "[private phone]");
}

function cleanArray(values, limit, max) {
  return (Array.isArray(values) ? values : []).map(value => redactSensitive(clean(value, max))).filter(Boolean).slice(0, limit);
}
function canonical(value) {
  return clean(value, 1200).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function stableId(value) {
  return createHash("sha256").update(String(value || "")).digest("hex").slice(0, 32);
}
function clamp01(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
