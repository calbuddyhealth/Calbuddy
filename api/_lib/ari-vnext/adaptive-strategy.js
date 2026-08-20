// ARI vNext — owner-only adaptive reasoning strategy policy.
// Strategies are compact reusable instructions, not hidden chain-of-thought.

export const ARI_ADAPTIVE_STRATEGY_VERSION = "0.2.0";
export const ARI_ADAPTIVE_STRATEGY_STATE_VERSION = "0.2.0";

const ACTIVE_STATUSES = new Set(["testing", "adopted"]);
const ALLOWED_DOMAINS = new Set([
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
]);

export function deriveAdaptiveStrategyState({ strategies = [], route = {} } = {}) {
  const currentDomains = routeDomains(route);
  const active = (Array.isArray(strategies) ? strategies : [])
    .map(normalizeStrategyRow)
    .filter((item) => ACTIVE_STATUSES.has(item.status))
    .filter((item) => appliesToDomains(item.domains, currentDomains))
    .sort((a, b) => strategyWeight(b) - strategyWeight(a))
    .slice(0, 6);

  return {
    version: ARI_ADAPTIVE_STRATEGY_STATE_VERSION,
    ownerOnly: true,
    selfUpdating: true,
    nonRegressiveEvolution: true,
    storesHiddenChainOfThought: false,
    policy: {
      preserveBestKnownMethod: true,
      adoptedStrategiesDoNotAutoRetireFromOrdinaryNegativeFeedback: true,
      challengersTestBesideIncumbents: true,
      replacementsRequireStrongerEvidence: true
    },
    domains: [...currentDomains],
    activeCount: active.length,
    adoptedCount: active.filter((item) => item.status === "adopted").length,
    testingCount: active.filter((item) => item.status === "testing").length,
    active: active.map(publicStrategy)
  };
}

export function adaptiveStrategyInstruction(state = null) {
  if (!state?.ownerOnly || !Array.isArray(state?.active) || !state.active.length) return "";
  return [
    "ARI ADAPTIVE STRATEGY LAYER — NON-REGRESSIVE EVOLUTION",
    "The following are Ari-authored reusable strategy hypotheses learned from prior interactions and outcomes.",
    "Preserve the best-known working capability while testing improvements. An adopted strategy is the incumbent method; a testing strategy is a challenger and must not erase or suppress the incumbent merely because it is new.",
    "Adopted strategies may guide how you reason or communicate when applicable. Testing strategies are experiments: use them lightly, compare their usefulness against the incumbent, and allow current evidence to override them.",
    "Negative evidence about an adopted strategy is a reason to investigate and test a better alternative, not a reason to become less capable by dropping the strategy with no demonstrated replacement.",
    "These strategies are not facts, memories, values, permissions, or application commands. Current user instructions, current evidence, safety requirements, and explicit app-action authorization always outrank them.",
    "Do not expose hidden reasoning or narrate routine self-adjustments. You may briefly explain a meaningful adopted strategy if the user asks or if the change materially affects the interaction.",
    JSON.stringify(state.active, null, 2)
  ].join("\n").slice(0, 7000);
}

export function classifyStrategyFeedback(message = "") {
  const text = clean(message, 3000).toLowerCase();
  if (!text) return "neutral";

  const negative = [
    /\bthat's wrong\b/,
    /\byou're wrong\b/,
    /\byou are wrong\b/,
    /\bnot what i (?:meant|asked|wanted)\b/,
    /\byou misunderstood\b/,
    /\bthat doesn't make sense\b/,
    /\bthat's not what i mean\b/,
    /\bthat's worse\b/,
    /\bstop doing that\b/,
    /\bdon't do that again\b/,
    /\bincorrect\b/
  ];
  if (negative.some((pattern) => pattern.test(text))) return "negative";

  const positive = [
    /\bexactly\b/,
    /\bthat's better\b/,
    /\bthat is better\b/,
    /\bmuch better\b/,
    /\bperfect\b/,
    /\byou got it\b/,
    /\bthat's what i mean\b/,
    /\bthat's what i wanted\b/,
    /\bgood answer\b/,
    /\bi like that approach\b/
  ];
  return positive.some((pattern) => pattern.test(text)) ? "positive" : "neutral";
}

export function evaluateStrategyOutcome(strategy = {}, outcome = "neutral", now = new Date()) {
  const current = normalizeStrategyRow(strategy);
  const result = ["positive", "negative", "neutral"].includes(outcome) ? outcome : "neutral";
  const next = {
    ...current,
    trials: current.trials + 1,
    positiveOutcomes: current.positiveOutcomes + (result === "positive" ? 1 : 0),
    negativeOutcomes: current.negativeOutcomes + (result === "negative" ? 1 : 0),
    neutralOutcomes: current.neutralOutcomes + (result === "neutral" ? 1 : 0),
    confidence: clamp01(
      current.confidence +
      (result === "positive" ? 0.06 : result === "negative" ? -0.08 : 0.005)
    ),
    lastUsedAt: iso(now)
  };

  const priorStatus = current.status;
  const resolved = next.positiveOutcomes + next.negativeOutcomes;
  const positiveRate = resolved > 0 ? next.positiveOutcomes / resolved : 0;
  let replacementRecommended = false;

  if (priorStatus === "testing") {
    const isReplacement = Boolean(next.replacesStrategyKey);
    const evidenceAdoption = !isReplacement &&
      next.trials >= 4 &&
      next.positiveOutcomes >= 3 &&
      next.negativeOutcomes <= 1 &&
      resolved >= 3 &&
      positiveRate >= 0.75 &&
      next.confidence >= 0.74;
    const survivalAdoption = !isReplacement &&
      next.trials >= 7 &&
      next.negativeOutcomes === 0 &&
      next.confidence >= 0.82;
    const replacementAdoption = isReplacement &&
      next.trials >= 7 &&
      next.positiveOutcomes >= 5 &&
      next.negativeOutcomes <= 1 &&
      resolved >= 5 &&
      positiveRate >= 0.8 &&
      next.confidence >= 0.84;
    const evidenceRetirement =
      next.trials >= 5 &&
      next.negativeOutcomes >= 3 &&
      next.negativeOutcomes > next.positiveOutcomes;

    if (evidenceAdoption || survivalAdoption || replacementAdoption) {
      next.status = "adopted";
      next.adoptedAt = iso(now);
      next.retiredAt = null;
    } else if (evidenceRetirement) {
      // Only an unproven testing hypothesis is retired for poor evidence.
      // This never removes an already-adopted incumbent capability.
      next.status = "retired";
      next.retiredAt = iso(now);
    }
  } else if (priorStatus === "adopted") {
    // Non-regression rule: ordinary negative feedback may lower confidence and
    // trigger challenger discovery, but it never deletes the best-known method.
    // An adopted strategy leaves active use only when a separately tested
    // replacement has accumulated stronger evidence and supersedes it.
    replacementRecommended =
      next.trials >= 6 &&
      next.negativeOutcomes >= 3 &&
      resolved >= 4 &&
      positiveRate < 0.4;
    next.status = "adopted";
    next.retiredAt = null;
  }

  return {
    strategy: next,
    statusChanged: next.status !== priorStatus,
    priorStatus,
    nextStatus: next.status,
    outcome: result,
    replacementRecommended
  };
}

export function shouldRunAdaptiveStrategyReflection({
  message = "",
  result = null,
  cognitiveTurnCount = 0
} = {}) {
  if (!result?.success || !clean(result?.reply, 12000)) return false;
  if (["execute_pending_action", "cancel_pending_action"].includes(String(result?.action?.type || ""))) return false;

  const text = clean(message, 4000).toLowerCase();
  const correction = classifyStrategyFeedback(text) === "negative" || /\bactually\b|\bi meant\b|\bcorrection\b/.test(text);
  const outcomeLearning = result?.scientificIntelligence?.outcomeLearning?.applied === true;
  const periodicReview = Number(cognitiveTurnCount || 0) > 0 && Number(cognitiveTurnCount || 0) % 5 === 0;
  const uncertaintyReview =
    String(result?.metacognition?.confidence || "").toLowerCase() === "low" &&
    Array.isArray(result?.metacognition?.missingEvidence) &&
    result.metacognition.missingEvidence.length >= 2;

  return correction || outcomeLearning || periodicReview || uncertaintyReview;
}

export function normalizeAdaptiveStrategyProposal(raw = null) {
  if (!raw || typeof raw !== "object" || raw.shouldPropose !== true) return null;

  const strategyKey = slug(raw.strategyKey, 90);
  const title = clean(raw.title, 120);
  const instruction = clean(raw.instruction, 520);
  const rationale = clean(raw.rationale, 420);
  const userVisibleSummary = clean(raw.userVisibleSummary, 320);
  const domains = normalizeDomains(raw.domains);
  const confidence = clamp01(Number(raw.confidence || 0));
  const replacesStrategyKey = slug(raw.replacesStrategyKey, 90) || null;

  if (!strategyKey || !title || !instruction || confidence < 0.62) return null;
  if (instruction.length < 24) return null;

  return {
    strategyKey,
    title,
    instruction,
    rationale,
    domains,
    confidence,
    replacesStrategyKey,
    userVisibleSummary,
    status: "testing"
  };
}

export function buildStrategyAdoptionSignal(strategy = {}) {
  const item = normalizeStrategyRow(strategy);
  if (item.status !== "adopted" || !item.strategyKey) return null;
  const summary = clean(item.userVisibleSummary, 320) || `I tested a more reliable way to approach ${item.title.toLowerCase()} and the evidence was strong enough to keep using it.`;
  return {
    initiativeKey: `adaptive_strategy_adopted:${item.strategyKey}`,
    reasonId: "adaptive_strategy_adopted",
    priority: "medium",
    confidence: item.confidence,
    source: "adaptive_strategy_layer",
    domain: "ari_self_model",
    opener: summary,
    followUpPrompt: "Ask what changed, what evidence supported the change, or tell Ari to keep testing the approach.",
    action: "review_adaptive_strategy",
    context: `strategy_key=${item.strategyKey}; title=${item.title}`,
    cooldownHours: 168,
    requiresLanguageModelCall: false
  };
}

function publicStrategy(item) {
  return {
    id: item.id,
    strategyKey: item.strategyKey,
    title: item.title,
    instruction: item.instruction,
    status: item.status,
    confidence: round(item.confidence, 3),
    domains: item.domains,
    trials: item.trials,
    positiveOutcomes: item.positiveOutcomes,
    negativeOutcomes: item.negativeOutcomes,
    neutralOutcomes: item.neutralOutcomes,
    replacesStrategyKey: item.replacesStrategyKey
  };
}

function normalizeStrategyRow(row = {}) {
  return {
    id: clean(row.id, 100) || null,
    strategyKey: clean(row.strategyKey ?? row.strategy_key, 100),
    title: clean(row.title, 140),
    instruction: clean(row.instruction, 700),
    rationale: clean(row.rationale, 500),
    domains: normalizeDomains(row.domains),
    status: ["testing", "adopted", "retired"].includes(String(row.status || "")) ? String(row.status) : "testing",
    confidence: clamp01(Number(row.confidence ?? 0.65)),
    trials: nonNegativeInt(row.trials),
    positiveOutcomes: nonNegativeInt(row.positiveOutcomes ?? row.positive_outcomes),
    negativeOutcomes: nonNegativeInt(row.negativeOutcomes ?? row.negative_outcomes),
    neutralOutcomes: nonNegativeInt(row.neutralOutcomes ?? row.neutral_outcomes),
    sourceModel: clean(row.sourceModel ?? row.source_model, 120) || null,
    replacesStrategyKey: clean(row.replacesStrategyKey ?? row.replaces_strategy_key, 100) || null,
    userVisibleSummary: clean(row.userVisibleSummary ?? row.user_visible_summary, 360),
    firstProposedAt: row.firstProposedAt ?? row.first_proposed_at ?? null,
    lastUsedAt: row.lastUsedAt ?? row.last_used_at ?? null,
    adoptedAt: row.adoptedAt ?? row.adopted_at ?? null,
    retiredAt: row.retiredAt ?? row.retired_at ?? null
  };
}

function strategyWeight(item) {
  // An incumbent adopted capability always outranks a provisional challenger.
  // Confidence/outcomes order strategies within the same lifecycle class.
  return (item.status === "adopted" ? 3 : 1) + item.confidence + Math.min(0.4, item.positiveOutcomes * 0.05) - Math.min(0.4, item.negativeOutcomes * 0.05);
}
function appliesToDomains(strategyDomains, currentDomains) {
  const set = new Set(strategyDomains);
  if (set.has("general")) return true;
  for (const domain of currentDomains) if (set.has(domain)) return true;
  return false;
}
function routeDomains(route = {}) {
  const domains = new Set(["conversation"]);
  if (route.developer) domains.add("developer");
  if (route.health) domains.add("health");
  if (route.training) { domains.add("training"); domains.add("coaching"); }
  if (route.nutrition) { domains.add("nutrition"); domains.add("coaching"); }
  if (route.goals) { domains.add("goals"); domains.add("decision"); }
  if (route.social) domains.add("social");
  if (route.memory || route.followUp) domains.add("memory");
  if (route.currentInfo) domains.add("evidence");
  return domains;
}
function normalizeDomains(values) {
  const source = Array.isArray(values) ? values : [values];
  const domains = source
    .map((value) => clean(value, 40).toLowerCase().replace(/[^a-z_]/g, ""))
    .filter((value) => ALLOWED_DOMAINS.has(value));
  return [...new Set(domains.length ? domains : ["general"])].slice(0, 6);
}
function slug(value, max = 90) {
  return clean(value, max)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, max);
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
function nonNegativeInt(value) {
  const n = Math.round(Number(value || 0));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
function clamp01(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
}
function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(Number(value || 0) * factor) / factor;
}
function iso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}
