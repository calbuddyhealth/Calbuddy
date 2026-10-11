import { createHash } from "node:crypto";

// A cited passage is evidence of observable application, not proof of causality.
// Unobservable internal methods receive no application credit.
export function validateStrategyApplications(applications = [], strategies = [], reply = "") {
  const text = clean(reply);
  const known = new Map(strategies.map(item => [item.strategyKey, item]));
  const seen = new Set();
  return (Array.isArray(applications) ? applications : []).filter(item => {
    const quote = clean(item?.evidenceQuote);
    if (!known.has(item?.strategyKey) || seen.has(item.strategyKey) || quote.length < 16 || !text.includes(quote)) return false;
    seen.add(item.strategyKey);
    return true;
  }).slice(0, 6).map(item => ({
    strategyId: known.get(item.strategyKey).id, strategyKey: item.strategyKey,
    evidenceQuote: clean(item.evidenceQuote).slice(0, 600), source: "model_assessed_visible_application"
  }));
}

export function responseFingerprint(reply = "") {
  const text = clean(reply).slice(0, 1000);
  return text ? createHash("sha256").update(text).digest("hex") : null;
}

export function selectFeedbackTarget({ uses = [], strategies = [], message = "", previousReply = "" } = {}) {
  const fingerprint = responseFingerprint(previousReply);
  const eligible = uses.filter(item => item.response_hash === fingerprint && fingerprint && item.application_evidence?.source === "model_assessed_visible_application");
  if (eligible.length === 1) return eligible[0];
  const text = clean(message).toLowerCase();
  const named = eligible.filter(use => {
    const strategy = strategies.find(item => item.id === use.strategy_id);
    return [strategy?.strategyKey, strategy?.title].some(label => label && text.includes(label.toLowerCase()));
  });
  return named.length === 1 ? named[0] : null;
}
function clean(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
