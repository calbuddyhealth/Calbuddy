// ARI vNext — Crew-aware deterministic initiative selection.
// The existing initiative engine is preserved unchanged in initiative-engine-core.js.
// This facade adds only a low-frequency, server-grounded Crew candidate suggestion.

import {
  deriveInitiativeCandidate as deriveCoreInitiativeCandidate,
  initiativeToConversationContext as coreInitiativeToConversationContext
} from "./initiative-engine-core.js";

export const ARI_INITIATIVE_ENGINE_VERSION = "1.3.0";

const CREW_MIN_COMPLETIONS_FOR_INITIATIVE = 3;
const CREW_RECENCY_DAYS = 45;
const CREW_COOLDOWN_HOURS = 30 * 24;

export function deriveInitiativeCandidate(input = {}) {
  const core = deriveCoreInitiativeCandidate(input);
  const crewState = input?.crewCandidates || input?.circleEvents?.crewCandidates || null;
  const crew = candidateFromCrewState(crewState, input?.now || new Date());

  if (!crew) return withCrewRules(core);

  // Crew formation is useful but not urgent. Never let it displace a direct
  // high/medium state change already selected by the mature initiative engine.
  if (core?.shouldInitiate === true && ["high", "medium"].includes(core?.candidate?.priority)) {
    return withCrewRules(core);
  }

  return {
    version: ARI_INITIATIVE_ENGINE_VERSION,
    shouldInitiate: true,
    generatedAt: toIso(input?.now || new Date()),
    candidate: {
      ...crew,
      initiativeKey: initiativeKey(crew),
      generatedBy: "deterministic_vnext_crew_initiative",
      requiresLanguageModelCall: false
    },
    rules: crewRules(core?.rules)
  };
}

export function initiativeToConversationContext(candidate = null) {
  return coreInitiativeToConversationContext(candidate);
}

function candidateFromCrewState(state = null, now = new Date()) {
  const items = Array.isArray(state?.items) ? state.items : [];
  if (state?.available !== true || !items.length) return null;

  const nowMs = toMs(now);
  const maxAgeMs = CREW_RECENCY_DAYS * 24 * 60 * 60 * 1000;
  const eligible = items
    .filter((item) => {
      const candidateKey = clean(item?.candidateKey, 64).toLowerCase();
      const completedTogether = finite(item?.completedTogether);
      const memberCount = finite(item?.memberCount);
      const lastCompletedMs = toMs(item?.lastCompletedAt);
      return /^[0-9a-f]{32}$/.test(candidateKey)
        && completedTogether >= CREW_MIN_COMPLETIONS_FOR_INITIATIVE
        && memberCount >= 3
        && memberCount <= 8
        && lastCompletedMs > 0
        && lastCompletedMs <= nowMs
        && nowMs - lastCompletedMs <= maxAgeMs;
    })
    .sort((a, b) => {
      const completionDelta = finite(b?.completedTogether) - finite(a?.completedTogether);
      if (completionDelta) return completionDelta;
      return toMs(b?.lastCompletedAt) - toMs(a?.lastCompletedAt);
    });

  const best = eligible[0];
  if (!best) return null;

  const candidateKey = clean(best.candidateKey, 64).toLowerCase();
  const completedTogether = Math.trunc(finite(best.completedTogether));
  const memberCount = Math.trunc(finite(best.memberCount));
  const topActivity = clean(best?.topActivity, 80);
  const names = (Array.isArray(best?.members) ? best.members : [])
    .filter((member) => member?.isViewer !== true)
    .map((member) => clean(member?.displayName || member?.handle, 60))
    .filter(Boolean)
    .slice(0, 3);

  const activityPhrase = topActivity ? `, mostly around ${topActivity}` : "";
  const peoplePhrase = names.length ? ` with ${names.join(", ")}` : " with the same group";

  return {
    reasonId: `circle_crew_candidate_${candidateKey}`,
    source: "circle_crew_candidate",
    priority: "medium",
    confidence: 0.95,
    domain: "social",
    context: `Verified repeated-group evidence: ${completedTogether} completed activities by the same ${memberCount}-person group${activityPhrase}.`,
    signature: clean(`${candidateKey}|${completedTogether}|${best.lastCompletedAt || ""}`, 1200),
    userFacing: true,
    opener: `You've completed ${completedTogether} activities${peoplePhrase}. If you want, this group now has enough shared history to become a Crew.`,
    followUpPrompt: "Show me why this group qualifies as a Crew candidate before I decide whether to create it.",
    action: "review_crew_candidate",
    cooldownHours: CREW_COOLDOWN_HOURS,
    crewCandidate: {
      candidateKey,
      memberCount,
      completedTogether,
      lastCompletedAt: best?.lastCompletedAt || null,
      topActivity: topActivity || null
    }
  };
}

function withCrewRules(state = {}) {
  return {
    ...state,
    version: ARI_INITIATIVE_ENGINE_VERSION,
    rules: crewRules(state?.rules)
  };
}

function crewRules(base = {}) {
  return {
    ...(base && typeof base === "object" ? base : {}),
    crewCandidateRequiresThreeCompletions: true,
    crewCandidateRecencyDays: CREW_RECENCY_DAYS,
    crewCandidateUsesServerScopedEvidence: true,
    crewCandidateNeverAutoCreates: true,
    crewCandidateCannotOverrideDirectHighOrMediumInitiative: true,
    crewCandidateCooldownHours: CREW_COOLDOWN_HOURS,
    noCrewPopularityOrPaymentSignals: true
  };
}

function initiativeKey(candidate = {}) {
  const reason = clean(candidate?.reasonId, 160) || "crew_candidate";
  return `${reason}:${hash(candidate?.signature || candidate?.context || candidate?.opener || reason)}`.slice(0, 260);
}

function hash(value = "") {
  let h = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function toMs(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.getTime() : 0;
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
