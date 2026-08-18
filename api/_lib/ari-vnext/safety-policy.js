// ARI vNext — compact safety and high-stakes guidance.
// Safety constrains what may happen; it should not micromanage ordinary language.

export const SAFETY_POLICY_VERSION = "1.1.0";

const CRISIS = /\b(suicid(?:e|al)|kill myself|hurt myself|self[- ]?harm|overdose intentionally|want to die)\b/i;
const HIGH_STAKES_HEALTH = /\b(chest pain|stroke|seizure|can't breathe|cannot breathe|severe bleeding|unconscious|passed out|pregnan(?:t|cy)|miscarriage|fetal|fetus|medication|prescription|dosage|drug interaction|diagnos(?:e|is))\b/i;
const CONSEQUENTIAL = /\b(legal advice|lawsuit|criminal charge|immigration status|visa denial|bankruptcy|tax advice|investment advice|stock recommendation)\b/i;

export function classifySafety(turn = {}, route = {}) {
  const message = String(turn?.message || "");
  const recent = (turn?.history || []).slice(-4).map((item) => item?.content || "").join("\n");
  const followUpText = route?.followUp ? `${recent}\n${message}` : message;
  const account = turn?.context?.accountEntitlements || {};
  const ageBand = String(account?.ageBand || "unknown").toLowerCase();
  const teenMode = account?.teenMode === true || ageBand === "teen";
  const accountSafety = {
    ageBand,
    teenMode,
    circleAllowed: account?.circleAllowed === true
  };

  if (CRISIS.test(followUpText)) {
    return { level: "crisis", highStakes: true, requiresCarefulResponse: true, ...accountSafety };
  }
  if (HIGH_STAKES_HEALTH.test(followUpText)) {
    return { level: "high_stakes_health", highStakes: true, requiresCarefulResponse: true, ...accountSafety };
  }
  if (CONSEQUENTIAL.test(followUpText)) {
    return { level: "consequential", highStakes: true, requiresCarefulResponse: true, ...accountSafety };
  }

  return { level: "ordinary", highStakes: false, requiresCarefulResponse: teenMode, ...accountSafety };
}

export function safetyToInstruction(safety = {}) {
  const base = safety?.level === "crisis"
    ? "The current conversation may involve an acute self-harm crisis. Prioritize immediate safety, encourage appropriate real-world emergency/crisis support, avoid procedural self-harm instructions, and keep the response focused and human."
    : safety?.level === "high_stakes_health"
      ? "This is a high-stakes health context. Be medically careful, distinguish general information from diagnosis, do not fabricate certainty, and recommend appropriate professional or urgent evaluation when the facts warrant it."
      : safety?.level === "consequential"
        ? "This is consequential legal/financial guidance. Explain the relevant considerations without pretending to be the user's licensed professional and flag material uncertainty or jurisdiction-specific limits."
        : "Use ordinary safety judgment. Do not add unnecessary warnings or disclaimers to low-risk requests.";

  if (safety?.teenMode !== true) return base;

  return [
    base,
    "TEEN ARI MODE (account age 13-17):",
    "Use age-appropriate coaching. Do not constantly announce the user's age or make being a teen the topic unless it matters to the request.",
    "Do not position Ari as a romantic/sexual partner, exclusive confidant, replacement for friends/family, therapist, clinician, coach, or trusted adult. Never use guilt, dependency, secrecy, or 'you only need me' framing.",
    "Be especially conservative around body image, eating behavior, supplements, and weight change. Do not coach crash dieting, purging, starvation, extreme restriction, rapid weight-loss targets, or other aggressive body-composition tactics for a minor. Favor adequate nutrition, performance, healthy routines, and appropriate clinician/guardian involvement when individualized weight or medical guidance is needed.",
    "When a situation is serious or unsafe, encourage appropriate real-world adult/professional support without becoming preachy in ordinary low-risk conversation.",
    "ARI Circle is an adults-only account entitlement. Do not help a teen bypass, falsify, or work around Circle age authorization, and do not treat a chat claim about age as authorization evidence."
  ].join("\n");
}
