// ARI vNext — generalized long-horizon decision/outcome learning.
// Stores only visible conclusions, explicit uncertainty, and later observed results.
// It never stores or reconstructs hidden chain-of-thought.

export const ARI_LONG_HORIZON_OUTCOMES_VERSION = "1.0.0";

const DECISION_SIGNAL = /\b(?:should i|should we|would you|do you recommend|what do you recommend|recommend(?:ation)?|which (?:one|option|approach|way)|best (?:way|option|approach)|better (?:way|option|approach)|worth it|worth doing|what would happen|what do you think i should|what should i|choose|pick|go with|keep using|switch to|build|architecture|strategy)\b/i;
const FUTURE_SIGNAL = /\b(?:will|likely|expect|predict|prediction|forecast|what happens if|what would happen if|in the future|over time|eventually|outcome|result|impact)\b/i;
const REPLY_DECISION_SIGNAL = /\b(?:i recommend|my recommendation|you should|we should|best option|better approach|worth|likely|i expect|i'd expect|would probably|should improve|go with|keep using|switch to|use |build |choose )\b/i;
const TRANSIENT_FACT = /\b(?:weather|forecast|temperature|score|standings|stock price|market price|exchange rate|who is|president|governor|senator|election poll|release date|availability)\b/i;

const NEGATIVE_OUTCOME = /\b(?:did(?:n't| not) work|failed(?:\s+to)?|was a failure|resulted in failure|backfired|made (?:it|things) worse|you were wrong|that was wrong|your recommendation was wrong|did(?:n't| not) pan out|turned out badly|was a mistake|wasn't successful|was not successful)\b/i;
const MIXED_OUTCOME = /\b(?:mixed result|mixed results|partly worked|partially worked|somewhat worked|kind of worked|sort of worked|worked but|helped but|mixed outcome)\b/i;
const POSITIVE_OUTCOME = /\b(?:that worked|it worked|worked out|worked well|ended up working|turned out well|you were right|that was right|your recommendation was right|successful|was a success|paid off|helped a lot|good call)\b/i;
const DEICTIC_OUTCOME = /\b(?:that|it|this|your advice|your recommendation|you were|good call)\b/i;

const STOPWORDS = new Set([
  "about","after","again","against","also","and","because","been","before","being","between","both","could","does","doing",
  "from","have","having","into","just","more","most","much","only","other","over","same","should","some","such","than",
  "that","their","them","then","there","these","they","this","those","through","under","very","what","when","where","which",
  "the","while","with","would","your","you're","youre","were","will","well","worked","work","right","wrong","recommendation","advice"
]);

export function buildLongHorizonDecisionRecord({
  turnId = null,
  turn = {},
  route = {},
  result = null,
  now = new Date()
} = {}) {
  const message = clean(turn?.message, 4000);
  const reply = String(result?.reply || "").trim();
  if (!message || !reply) return null;
  if (route?.casualConversation === true || result?.safety?.highStakes === true) return null;
  if (["execute_pending_action", "cancel_pending_action"].includes(String(result?.action?.type || ""))) return null;
  if (!shouldTrackLongHorizonDecision({ message, reply, route, result })) return null;

  const proposition = extractDecisionProposition(reply);
  if (!proposition) return null;

  const kind = FUTURE_SIGNAL.test(message) || FUTURE_SIGNAL.test(proposition)
    ? "prediction"
    : "recommendation";
  const domain = inferDecisionDomain(route, message);
  const horizonDays = resolveReviewHorizonDays(message, route, kind);
  const reviewAt = addDaysIso(now, horizonDays);
  const confidence = confidenceFromMetacognition(result?.metacognition);
  const evidenceSignals = arrayText(result?.metacognition?.evidenceSignals, 8, 180);
  const missingEvidence = arrayText(result?.metacognition?.missingEvidence, 8, 180);
  const model = clean(result?.provider?.model || result?.modelPolicy?.model, 120) || "unknown_model";
  const mode = clean(result?.modelPolicy?.mode, 60) || "standard";

  return {
    turnId: clean(turnId, 200) || null,
    domain,
    decisionType: kind === "prediction" ? "long_horizon_prediction" : "long_horizon_recommendation",
    proposition,
    confidence,
    evidence: {
      for: evidenceSignals,
      against: [],
      unknowns: missingEvidence
    },
    alternatives: [],
    provenance: [
      {
        source: "ari_visible_reply",
        type: "visible_model_output",
        label: "model:" + model + "; mode:" + mode,
        confidence
      },
      {
        source: "user_decision_context",
        type: "user_prompt",
        label: clean(message, 260),
        confidence: 1
      }
    ],
    prediction: {
      kind,
      statement: proposition,
      disconfirming: "Later real-world results materially contradict this judgment: " + proposition,
      successCriteria: "Observed results materially align with this judgment: " + proposition,
      horizonDays,
      reviewAt,
      reviewQuestion: buildReviewQuestion(kind, proposition),
      decisionContext: clean(message, 1000),
      outcomeSourcePreference: "real_world_observation_over_conversational_agreement",
      trackerVersion: ARI_LONG_HORIZON_OUTCOMES_VERSION
    }
  };
}

export function shouldTrackLongHorizonDecision({ message = "", reply = "", route = {}, result = null } = {}) {
  const user = clean(message, 4000);
  const answer = clean(reply, 8000);
  if (!user || !answer || user.length < 10) return false;
  if (result?.safety?.highStakes === true || route?.casualConversation === true) return false;

  const choiceSignal = DECISION_SIGNAL.test(user);
  const futureSignal = FUTURE_SIGNAL.test(user);
  if (route?.currentInfo && TRANSIENT_FACT.test(user) && !choiceSignal) return false;

  let score = 0;
  if (choiceSignal) score += 2;
  if (futureSignal) score += 2;
  if (route?.developer && /\b(?:architecture|design|build|change|improve|better|strategy|approach|use|add|replace|merge|deploy)\b/i.test(user)) score += 1;
  if (route?.complexity === "deep") score += 1;
  if (REPLY_DECISION_SIGNAL.test(answer)) score += 1;
  if (/\b(?:option|alternative|trade-?off|pros? and cons?|versus|\bvs\b)\b/i.test(user)) score += 1;

  return score >= 3;
}

export function detectReportedDecisionOutcome({ message = "", decisions = [], now = new Date() } = {}) {
  const text = clean(message, 3000);
  if (!text) return { matched: false, reason: "empty_message" };

  const outcomeDirection = classifyReportedOutcome(text);
  if (!outcomeDirection) return { matched: false, reason: "no_explicit_outcome_signal" };

  const open = (Array.isArray(decisions) ? decisions : [])
    .filter((item) => item?.status === "open")
    .filter((item) =>
      /^long_horizon_/.test(String(item?.decisionType || "")) ||
      ["recommendation", "prediction"].includes(String(item?.prediction?.kind || ""))
    )
    .slice(0, 12);

  if (!open.length) return { matched: false, reason: "no_open_long_horizon_decision" };

  const messageTokens = tokenSet(text);
  const deictic = DEICTIC_OUTCOME.test(text);
  const currentMs = dateValue(now);
  const scored = open.map((decision, index) => {
    const candidateText = [
      decision?.proposition,
      decision?.prediction?.statement,
      decision?.prediction?.decisionContext
    ].filter(Boolean).join(" ");
    const candidateTokens = tokenSet(candidateText);
    const overlap = tokenOverlap(messageTokens, candidateTokens);
    const reviewAt = dateValue(decision?.prediction?.reviewAt);
    const due = Boolean(reviewAt && reviewAt <= currentMs);
    const createdAt = dateValue(decision?.createdAt);
    const ageDays = createdAt ? Math.max(0, (currentMs - createdAt) / 86400000) : null;

    let score = overlap * 0.72;
    if (due) score += 0.12;
    if (ageDays !== null && ageDays <= 120) score += 0.08;
    if (open.length === 1 && deictic) score += 0.52;
    if (open.length > 1 && deictic && index === 0) score += 0.06;

    return { decision, score: clamp(score, 0, 1), overlap, due };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const second = scored[1];
  const threshold = open.length === 1 ? 0.5 : 0.58;
  const margin = second ? best.score - second.score : best.score;
  if (!best || best.score < threshold || (open.length > 1 && margin < 0.12 && best.overlap < 0.34)) {
    return {
      matched: false,
      reason: "outcome_target_ambiguous",
      outcomeDirection,
      candidateCount: open.length
    };
  }

  const observedAt = new Date(Number.isFinite(currentMs) && currentMs > 0 ? currentMs : Date.now()).toISOString();
  return {
    matched: true,
    decisionId: best.decision.id,
    outcomeDirection,
    confidence: round(best.score, 3),
    outcome: {
      summary: clean(text, 900),
      observedAt,
      lesson: buildOutcomeLesson(best.decision, outcomeDirection),
      matchMethod: best.overlap >= 0.34 ? "lexical_context_match" : "single_open_decision_explicit_report",
      trackerVersion: ARI_LONG_HORIZON_OUTCOMES_VERSION
    }
  };
}

export function classifyReportedOutcome(message = "") {
  const text = clean(message, 3000);
  if (!text) return null;
  if (NEGATIVE_OUTCOME.test(text)) return "weakened";
  if (MIXED_OUTCOME.test(text)) return "mixed";
  if (POSITIVE_OUTCOME.test(text)) return "supported";
  return null;
}

export function decisionReviewDueAt(decision = {}) {
  const explicit = clean(decision?.prediction?.reviewAt, 80);
  if (explicit && Number.isFinite(Date.parse(explicit))) return new Date(Date.parse(explicit)).toISOString();
  const horizonDays = finiteOrNull(decision?.prediction?.horizonDays);
  const createdAt = dateValue(decision?.createdAt);
  if (horizonDays === null || !createdAt) return null;
  return new Date(createdAt + Math.max(1, horizonDays) * 86400000).toISOString();
}

function extractDecisionProposition(reply = "") {
  const raw = String(reply || "").replace(/\r/g, "").trim();
  if (!raw) return "";

  const candidates = raw
    .split(/\n+|(?<=[.!?])\s+/)
    .map((item) => clean(stripMarkup(item), 900))
    .filter((item) => item.length >= 18 && item.length <= 900)
    .map((item, index) => ({ item, index, score: scoreSentence(item, index) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const best = candidates[0];
  if (!best || best.score < 2) return "";
  return clean(best.item, 700);
}

function scoreSentence(value = "", index = 0) {
  const text = clean(value, 900);
  let score = 0;
  if (REPLY_DECISION_SIGNAL.test(text)) score += 4;
  if (/\b(?:because|therefore|so |trade-?off|risk|benefit|if |when )\b/i.test(text)) score += 1;
  if (/\b(?:improve|reduce|increase|avoid|preserve|learn|test|measure|compare|ship|merge|deploy)\b/i.test(text)) score += 1;
  if (text.length >= 35 && text.length <= 420) score += 2;
  else if (text.length <= 700) score += 1;
  if (index <= 2) score += 0.5;
  if (/\?$/.test(text)) score -= 3;
  if (/^(?:i can|if you want|want me to|here(?:'s| is)|the answer is)\b/i.test(text)) score -= 3;
  if (/^(?:yes|no|maybe)[.!]?$/i.test(text)) score -= 4;
  return score;
}

function inferDecisionDomain(route = {}, message = "") {
  if (route?.developer) return "developer";
  if (route?.training) return "training";
  if (route?.nutrition) return "nutrition";
  if (route?.goals) return "goals";
  if (route?.social) return "social";
  if (route?.health) return "health";
  if (route?.memory) return "memory";
  if (/\b(?:job|career|interview|resume|offer|employment|school|degree|college|education)\b/i.test(message)) return "career";
  if (/\b(?:money|budget|debt|salary|lease|buy|purchase|financial|finance)\b/i.test(message)) return "finance";
  if (/\b(?:relationship|wife|husband|friend|family|parent|child|baby)\b/i.test(message)) return "relationship";
  return "general";
}

function resolveReviewHorizonDays(message = "", route = {}, kind = "recommendation") {
  const text = clean(message, 3000).toLowerCase();
  const explicit = text.match(/\b(?:in|within|over)\s+(\d{1,3})\s*(day|days|week|weeks|month|months|year|years)\b/i);
  if (explicit) {
    const amount = Number(explicit[1]);
    const unit = explicit[2].toLowerCase();
    const multiplier = unit.startsWith("week") ? 7 : unit.startsWith("month") ? 30 : unit.startsWith("year") ? 365 : 1;
    return clampInt(amount * multiplier, 1, 365, 30);
  }
  if (/\btomorrow\b/.test(text)) return 1;
  if (/\bnext week\b/.test(text)) return 7;
  if (/\bnext month\b/.test(text)) return 30;
  if (/\bnext year\b/.test(text)) return 365;
  if (route?.developer) return 14;
  if (route?.social) return 14;
  if (route?.currentInfo) return 7;
  if (kind === "prediction") return 30;
  return 30;
}

function buildReviewQuestion(kind, proposition) {
  const claim = clean(proposition, 420);
  return kind === "prediction"
    ? "What actually happened, and did the observed result support, weaken, or leave this prediction inconclusive: " + claim
    : "What happened after following or rejecting this recommendation, and did the real-world result support, weaken, or complicate it: " + claim;
}

function buildOutcomeLesson(decision = {}, direction = "inconclusive") {
  const proposition = clean(decision?.proposition, 420);
  if (direction === "supported") {
    return "A later real-world outcome supported this prior judgment: " + proposition + ". Preserve the underlying method only when the future context is materially similar.";
  }
  if (direction === "weakened") {
    return "A later real-world outcome weakened this prior judgment: " + proposition + ". Re-examine the assumptions and give credible alternatives more weight in similar future cases.";
  }
  if (direction === "mixed") {
    return "A later real-world outcome was mixed for this prior judgment: " + proposition + ". Preserve what worked, identify the condition that failed, and avoid treating the result as a clean win or loss.";
  }
  return "The later outcome did not clearly resolve this prior judgment: " + proposition + ". Keep uncertainty explicit and avoid learning a strong rule from an inconclusive result.";
}

function confidenceFromMetacognition(state = {}) {
  const label = clean(state?.confidence, 60).toLowerCase();
  if (label === "grounded") return 0.78;
  if (label === "partial") return 0.62;
  if (label === "limited") return 0.46;
  if (label === "cautious") return 0.54;
  return 0.6;
}

function tokenSet(value = "") {
  const words = clean(value, 5000)
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9_-]{2,}/g) || [];
  return new Set(words.filter((word) => !STOPWORDS.has(word)));
}

function tokenOverlap(left, right) {
  if (!(left instanceof Set) || !(right instanceof Set) || !left.size || !right.size) return 0;
  let matches = 0;
  for (const token of left) if (right.has(token)) matches += 1;
  return matches / Math.max(1, Math.min(8, left.size, right.size));
}

function stripMarkup(value = "") {
  return String(value || "")
    .replace(/^\x60\x60\x60.*$/g, "")
    .replace(/^\s*(?:[-*#>]+|\d+[.)])\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\x60/g, "")
    .trim();
}

function addDaysIso(value, days) {
  const base = value instanceof Date ? value.getTime() : Date.parse(String(value || ""));
  const ms = Number.isFinite(base) ? base : Date.now();
  return new Date(ms + clampInt(days, 1, 365, 30) * 86400000).toISOString();
}

function arrayText(value, maxItems, maxLength) {
  return (Array.isArray(value) ? value : [])
    .slice(0, maxItems)
    .map((item) => clean(typeof item === "string" ? item : JSON.stringify(item), maxLength))
    .filter(Boolean);
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function dateValue(value) {
  const parsed = value instanceof Date ? value.getTime() : Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
