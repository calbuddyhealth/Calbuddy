// Server-entitled owner fidelity is independent of the conversation route.
// This policy does not enable background workers or grant new permissions.
export const ARI_OWNER_ULTRA_VERSION = "1.0.0";

export function isOwnerUltra(entitlement = null) {
  return entitlement?.advancedEnabled === true &&
    (entitlement?.ownerEligible === true || entitlement?.accessClass === "owner") &&
    entitlement?.cognitiveLoopEnabled !== false;
}

export function isOwnerUltraRoute(route = {}) {
  return isOwnerUltra(route?.intelligenceEntitlement);
}

export function ownerTurnHydration({ entitlement = null, route = {}, casualConversation = false, message = "" } = {}) {
  const ownerUltra = isOwnerUltra(entitlement);
  const fitness = Boolean(route.training || route.nutrition || route.goals);
  return {
    ownerUltra,
    memory: ownerUltra || (!casualConversation && (route.memory || fitness)),
    decisions: ownerUltra || (!casualConversation && fitness),
    conversationLearning: ownerUltra || !casualConversation || String(message).trim().length >= 12,
    continuityPairs: ownerUltra || entitlement?.advancedEnabled === true ? 6 : 4
  };
}
