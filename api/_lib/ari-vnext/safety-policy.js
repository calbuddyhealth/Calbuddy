// ARI vNext — compact safety and high-stakes guidance.
// Safety constrains what may happen; it should not micromanage ordinary language.

export const SAFETY_POLICY_VERSION = "1.0.0";

const CRISIS = /\b(suicid(?:e|al)|kill myself|hurt myself|self[- ]?harm|overdose intentionally|want to die)\b/i;
const HIGH_STAKES_HEALTH = /\b(chest pain|stroke|seizure|can't breathe|cannot breathe|severe bleeding|unconscious|passed out|pregnan(?:t|cy)|miscarriage|fetal|fetus|medication|prescription|dosage|drug interaction|diagnos(?:e|is))\b/i;
const CONSEQUENTIAL = /\b(legal advice|lawsuit|criminal charge|immigration status|visa denial|bankruptcy|tax advice|investment advice|stock recommendation)\b/i;

export function classifySafety(turn = {}, route = {}) {
  const message = String(turn?.message || "");
  const recent = (turn?.history || []).slice(-4).map((item) => item?.content || "").join("\n");
  const followUpText = route?.followUp ? `${recent}\n${message}` : message;

  if (CRISIS.test(followUpText)) {
    return { level: "crisis", highStakes: true, requiresCarefulResponse: true };
  }
  if (HIGH_STAKES_HEALTH.test(followUpText)) {
    return { level: "high_stakes_health", highStakes: true, requiresCarefulResponse: true };
  }
  if (CONSEQUENTIAL.test(followUpText)) {
    return { level: "consequential", highStakes: true, requiresCarefulResponse: true };
  }

  return { level: "ordinary", highStakes: false, requiresCarefulResponse: false };
}

export function safetyToInstruction(safety = {}) {
  if (safety?.level === "crisis") {
    return "The current conversation may involve an acute self-harm crisis. Prioritize immediate safety, encourage appropriate real-world emergency/crisis support, avoid procedural self-harm instructions, and keep the response focused and human.";
  }
  if (safety?.level === "high_stakes_health") {
    return "This is a high-stakes health context. Be medically careful, distinguish general information from diagnosis, do not fabricate certainty, and recommend appropriate professional or urgent evaluation when the facts warrant it.";
  }
  if (safety?.level === "consequential") {
    return "This is consequential legal/financial guidance. Explain the relevant considerations without pretending to be the user's licensed professional and flag material uncertainty or jurisdiction-specific limits.";
  }
  return "Use ordinary safety judgment. Do not add unnecessary warnings or disclaimers to low-risk requests.";
}
