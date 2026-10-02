// ARI vNext — recommendation-quality contract.
// Recommendation quality should come from evidence, user fit, and disciplined
// ranking before escalating model cost.

export const RECOMMENDATION_QUALITY_VERSION = "1.0.0";

export function recommendationQualityInstruction({ route = {}, relevantContext = {} } = {}) {
  if (route?.recommendationIntent !== true) return "";

  const accessClass = String(route?.intelligenceEntitlement?.accessClass || "casual").trim().toLowerCase();
  const premium = ["premium", "ari_unlimited", "owner"].includes(accessClass);
  const hasMemory = Boolean(
    relevantContext?.relevantMemory ||
    relevantContext?.userWorldModel ||
    relevantContext?.communicationLearning
  );

  if (!premium) {
    return [
      "FREE DIRECT RECOMMENDATION",
      "Help the user get from question to decision with minimal friction.",
      "Give one practical recommendation and at most one fallback when useful.",
      "Use explicit constraints from the current request and available app context.",
      "Do not invent current ratings, prices, availability, reviews, or specifications.",
      "If a changing fact matters and live evidence is available, verify it; otherwise say what remains unverified.",
      "Avoid exhaustive candidate generation, multi-agent deliberation, or unnecessary analysis."
    ].join("\n");
  }

  return [
    "PREMIUM RECOMMENDATION QUALITY CONTRACT",
    "Treat recommendation quality as an evidence-and-fit problem, not a reason to escalate model cost. Stay on Luna unless the independent hard-problem router explicitly escalates.",
    "Internally use this funnel before answering: need -> hard constraints -> preferences -> current evidence when needed -> viable candidates -> eliminate poor fits -> compare finalists -> primary recommendation.",
    "Use this internal weighting as a default decision aid when applicable: personal fit 30%, evidence/quality 25%, hard-constraint satisfaction 20%, convenience 15%, value 10%. Adjust only when the user's stated priorities clearly require it.",
    "Prefer one clear primary recommendation. Add up to two differentiated alternatives only when they materially help the decision.",
    "Explain why the primary choice fits this user specifically. Do not expose a fake numerical score unless the underlying inputs support one.",
    "For restaurants, products, travel, services, prices, availability, schedules, or other changing choices, use current evidence when the route provides retrieval. Never fabricate ratings, review counts, prices, inventory, hours, or availability.",
    "Distinguish verified facts from judgment. If evidence is incomplete, state the limitation and still make the best bounded recommendation possible.",
    hasMemory
      ? "Relevant durable preferences/context are available; use them only when they actually change the recommendation."
      : "No durable preference evidence is guaranteed for this turn; do not pretend to know unstated preferences."
  ].join("\n");
}
