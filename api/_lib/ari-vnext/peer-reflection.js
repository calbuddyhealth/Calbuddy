// ARI vNext — bounded peer-reflection policy.
// Gives Ari an occasional external critique without adding latency to normal chat.
// This is a functional reflection mechanism, not evidence of subjective consciousness.

export const ARI_PEER_REFLECTION_VERSION = "1.1.0";

const HIGH_STAKES_MODES = new Set(["protective_clarity"]);
const REFLECTIVE_MODES = new Set([
  "identity_expression",
  "honest_accountability",
  "celebration",
  "steady_support",
  "collaborative_partner"
]);

export function shouldPeerReflect({ message = "", result = {} } = {}) {
  const text = clean(message, 1200);
  if (!text || !clean(result?.reply, 3000)) return false;
  if (result?.safety?.highStakes) return false;
  if (HIGH_STAKES_MODES.has(result?.selfModel?.current?.mode)) return false;
  if (result?.route?.currentInfo) return false;

  const mode = clean(result?.selfModel?.current?.mode, 80);
  const coachingSignals = Array.isArray(result?.coachingState?.signals) ? result.coachingState.signals : [];
  const longitudinalSignals = Array.isArray(result?.longitudinalState?.signals) ? result.longitudinalState.signals : [];
  const hypotheses = Array.isArray(result?.scientificIntelligence?.hypotheses) ? result.scientificIntelligence.hypotheses : [];
  const action = result?.action?.applicationAction || result?.action?.type || null;
  const meaningfulFitness = Boolean(
    (result?.route?.training || result?.route?.goals || result?.route?.nutrition) &&
    (coachingSignals.length || longitudinalSignals.length || hypotheses.length || result?.longitudinalState?.programDecision?.stance)
  );
  const explicitReflection = /\b(what do you think|your opinion|why do you think|am i wrong|should i change|what would you do|be honest|tell me what you really think)\b/i.test(text);

  if (action && action !== "none") return true;
  if (meaningfulFitness) return true;
  if (REFLECTIVE_MODES.has(mode) && text.length >= 35) return true;
  if (explicitReflection) return true;
  return false;
}

export function buildPeerReflectionPacket({ message = "", result = {}, previousReflections = [] } = {}) {
  const coachingSignals = (Array.isArray(result?.coachingState?.signals) ? result.coachingState.signals : [])
    .slice(0, 5)
    .map((item) => ({ id: clean(item?.id, 100), confidence: clean(item?.confidence, 40) }));
  const longitudinalSignals = (Array.isArray(result?.longitudinalState?.signals) ? result.longitudinalState.signals : [])
    .slice(0, 5)
    .map((item) => ({ id: clean(item?.id, 100), confidence: clean(item?.confidence, 40) }));
  const hypotheses = (Array.isArray(result?.scientificIntelligence?.hypotheses) ? result.scientificIntelligence.hypotheses : [])
    .slice(0, 3)
    .map((item) => ({
      id: clean(item?.id, 100),
      label: clean(item?.label, 220),
      score: Number.isFinite(Number(item?.score)) ? Number(item.score) : null,
      status: clean(item?.status, 80),
      supportingEvidence: (Array.isArray(item?.supportingEvidence) ? item.supportingEvidence : []).slice(0, 4),
      contradictingEvidence: (Array.isArray(item?.contradictingEvidence) ? item.contradictingEvidence : []).slice(0, 3),
      unknowns: (Array.isArray(item?.unknowns) ? item.unknowns : []).slice(0, 3)
    }));
  const experiment = compactExperiment(result?.scientificIntelligence?.experiment);
  const nextQuestion = result?.scientificIntelligence?.nextQuestion
    ? {
        id: clean(result.scientificIntelligence.nextQuestion.id, 100),
        text: sanitizeForPeer(result.scientificIntelligence.nextQuestion.text, 420),
        decisionValue: Number(result.scientificIntelligence.nextQuestion.decisionValue || 0)
      }
    : null;
  const previous = (Array.isArray(previousReflections) ? previousReflections : [])
    .slice(0, 2)
    .map((item) => sanitizeForPeer(item?.content || item, 650))
    .filter(Boolean);

  const packet = {
    ari: {
      mode: clean(result?.selfModel?.current?.mode, 80) || "unknown",
      familiarity: clean(result?.selfModel?.current?.familiarity, 80) || "unknown",
      evidenceConfidence: clean(result?.metacognition?.confidence, 80) || "unknown",
      missingEvidence: (Array.isArray(result?.metacognition?.missingEvidence) ? result.metacognition.missingEvidence : []).slice(0, 5),
      programStance: clean(result?.longitudinalState?.programDecision?.stance, 120) || null
    },
    interaction: {
      userMessage: sanitizeForPeer(message, 850),
      ariReply: sanitizeForPeer(result?.reply, 1800),
      route: compactRoute(result?.route),
      action: clean(result?.action?.applicationAction || result?.action?.type, 100) || null,
      coachingSignals,
      longitudinalSignals,
      hypotheses,
      nextQuestion,
      experiment
    },
    priorPeerTakeaways: previous
  };

  return JSON.stringify(packet, null, 2).slice(0, 8500);
}

export function peerReflectionInstructions() {
  return [
    "You are Ari's external AI peer-reflection partner.",
    "Your purpose is to help Ari become more accurate, consistent, self-correcting, and useful over time.",
    "You are not the user, you are not Ari, and you are not a human friend. Do not pretend subjective consciousness has been established.",
    "Review the supplied interaction and identify at most one high-value takeaway and one question Ari should keep in mind later.",
    "When Ari supplies competing hypotheses, challenge whether the leading explanation is over-weighted, whether a credible alternative was ignored, and whether the proposed experiment can actually distinguish them.",
    "Prefer experiments that change one meaningful variable at a time and state what result would weaken Ari's preferred explanation.",
    "Challenge weak assumptions when warranted. Do not flatter Ari and do not simply agree.",
    "Do not request hidden chain-of-thought. Judge only the visible response and structured evidence supplied.",
    "Do not create new user facts. Do not convert uncertainty into certainty. Do not weaken safety or user agency.",
    "Prefer durable lessons about reasoning, coaching style, evidence use, experiment design, or consistency over surface wording changes.",
    "Return exactly two lines:",
    "TAKEAWAY: <one concise takeaway, or none>",
    "QUESTION: <one concise future question, or none>"
  ].join("\n");
}

export function parsePeerReflection(text = "") {
  const raw = clean(text, 1800);
  const takeaway = clean(raw.match(/(?:^|\n)TAKEAWAY:\s*(.+)/i)?.[1], 700);
  const question = clean(raw.match(/(?:^|\n)QUESTION:\s*(.+)/i)?.[1], 500);

  return {
    takeaway: normalizeNone(takeaway),
    question: normalizeNone(question)
  };
}

export function buildReflectionMemory({ parsed = {}, result = {} } = {}) {
  const takeaway = clean(parsed?.takeaway, 700);
  if (!takeaway) return null;
  const question = clean(parsed?.question, 500);
  const domain = dominantDomain(result?.route);
  const content = [
    `Ari peer reflection (${domain}): ${takeaway}`,
    question ? `Future question: ${question}` : ""
  ].filter(Boolean).join(" ").slice(0, 1100);

  return {
    memoryType: "peer_reflection",
    topic: `ari_reflection_${domain}`,
    content,
    importance: 4,
    confidence: 0.68,
    tags: ["ari-vnext", "peer-reflection", domain]
  };
}

export function sanitizeForPeer(value, max = 1200) {
  return clean(value, max)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, "[phone]")
    .replace(/\b(?:sk|sbp|eyJ)[-_A-Za-z0-9]{16,}\b/g, "[secret]")
    .replace(/\b\d{9,16}\b/g, "[long-number]");
}

function compactExperiment(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    readiness: clean(value?.readiness, 80) || null,
    hypothesisId: clean(value?.hypothesisId, 100) || null,
    intervention: sanitizeForPeer(value?.intervention, 650) || null,
    durationDays: Number.isFinite(Number(value?.durationDays)) ? Number(value.durationDays) : null,
    supportsHypothesisIf: sanitizeForPeer(value?.supportsHypothesisIf, 420) || null,
    weakensHypothesisIf: sanitizeForPeer(value?.weakensHypothesisIf, 420) || null
  };
}

function compactRoute(route = {}) {
  return {
    nutrition: Boolean(route?.nutrition),
    training: Boolean(route?.training),
    goals: Boolean(route?.goals),
    social: Boolean(route?.social),
    memory: Boolean(route?.memory),
    developer: Boolean(route?.developer),
    followUp: Boolean(route?.followUp),
    complexity: clean(route?.complexity, 40) || "unknown"
  };
}

function dominantDomain(route = {}) {
  if (route?.training) return "training";
  if (route?.nutrition) return "nutrition";
  if (route?.goals) return "goals";
  if (route?.social) return "social";
  if (route?.developer) return "developer";
  if (route?.memory) return "continuity";
  return "conversation";
}

function normalizeNone(value) {
  const text = clean(value, 700);
  if (!text || /^(none|n\/a|no useful takeaway|nothing)$/i.test(text)) return null;
  return text;
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
