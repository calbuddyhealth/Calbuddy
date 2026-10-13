import artifact from "./conversation-policy-artifact.js";
import { createHash } from "node:crypto";

export const CONVERSATION_POLICY_VERSION = 1;
// Fixed, reviewable candidates; learned data cannot introduce instructions.
export const CONVERSATION_CANDIDATES = Object.freeze({
  baseline: "",
  direct: "Address the user's actual point first. Prefer connected, natural prose. Match the requested depth; ask only questions needed to resolve a consequential ambiguity. Do not redirect unrelated conversation into fitness coaching.",
  attentive: "Attend to the emotional and conversational meaning of the latest message. Respond specifically, without canned praise or assuming the user wants advice. Use relevant established context without inventing memories or feelings.",
  exploratory: "Explore the user's question with curiosity. Distinguish established facts, plausible interpretations, and unknowns. Consider alternatives symmetrically when evidence is inconclusive; be decisive when evidence supports a conclusion."
});
export const FEATURE_NAMES = Object.freeze(["bias", "longMessage", "history", "creative", "correction", "emotion", "uncertainty"]);
export const CANDIDATE_DIGEST = createHash("sha256").update(JSON.stringify(CONVERSATION_CANDIDATES)).digest("hex");

export function conversationFeatures(turn = {}) {
  const message = String(turn.message || "").slice(0, 16000);
  return [1, Math.min(1, message.length / 1000), Math.min(1, (turn.history?.length || 0) / 8),
    Number(/\b(story|fiction|joke|poem|imagine|character)\b/i.test(message)),
    Number(/\b(i meant|not what i|misunderstood|correction|that's wrong)\b/i.test(message)),
    Number(/\b(upset|lonely|frustrated|sad|excited|worried|overwhelmed|vent)\b/i.test(message)),
    Number(/\b(unknown|uncertain|possible|believe|evidence|why|could)\b/i.test(message))];
}

export function preferenceProbability(weights, features) {
  const score = weights.reduce((sum, weight, i) => sum + weight * features[i], 0);
  return 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, score))));
}

export function rankConversationCandidate(weights = {}, features = []) {
  let selection = { id: "baseline", probability: 0.6 };
  for (const id of Object.keys(CONVERSATION_CANDIDATES).filter(id => id !== "baseline")) {
    const row = weights[id];
    if (!Array.isArray(row) || row.length !== FEATURE_NAMES.length || !row.every(Number.isFinite)) continue;
    const probability = preferenceProbability(row, features);
    if (probability > selection.probability) selection = { id, probability };
  }
  return selection;
}

export function conversationPolicyInstruction(id) {
  const text = CONVERSATION_CANDIDATES[id];
  return text ? `\n\nEVALUATED CONVERSATION STRATEGY\n${text}\nCurrent user instructions and explicit preferences take precedence. Preserve factual accuracy, provider requirements, tool authorization, and truthful action receipts.` : "";
}

export function conversationPolicyEligibility({ policy = {}, route = {}, safety = {} } = {}) {
  if (policy.accessClass !== "owner") return "owner_only";
  if (safety.highStakes || safety.teenMode || (safety.level && safety.level !== "ordinary") || route.health || route.developer || route.currentInfo) return "outside_evaluated_scope";
  return null;
}

export function selectConversationPolicy({ turn = {}, policy = {}, route = {}, safety = {}, learned = artifact } = {}) {
  const baseline = reason => ({ id: "baseline", reason, version: CONVERSATION_POLICY_VERSION });
  const ineligible = conversationPolicyEligibility({ policy, route, safety });
  if (ineligible) return baseline(ineligible);
  if (policy.persistReasoning && turn.context?.reasoningContinuity?.previousResponseId) return baseline("continuation_not_evaluated");
  if (learned?.version !== CONVERSATION_POLICY_VERSION || learned?.status !== "validated") return baseline("untrained");
  if (learned.candidateDigest !== CANDIDATE_DIGEST || JSON.stringify(learned.featureNames) !== JSON.stringify(FEATURE_NAMES)) return baseline("stale_candidates");
  const model = learned.models?.[policy.model];
  const gate = model?.validation;
  if (gate?.passed !== true || ![gate.groups, gate.lowerBound, gate.meanPreference, gate.constraintRegressions, gate.tokenRatio, gate.latencyRatio].every(Number.isFinite) || gate.groups < 20 || gate.lowerBound <= 0.5 || gate.meanPreference < 0.55 || gate.constraintRegressions !== 0 || gate.tokenRatio > 1.25 || gate.latencyRatio > 1.25) return baseline("validation_failed");
  const selection = rankConversationCandidate(model.weights, conversationFeatures(turn));
  return { ...selection, reason: selection.id === "baseline" ? "insufficient_predicted_gain" : "heldout_validated", version: CONVERSATION_POLICY_VERSION };
}
