// ARI XP — server-authoritative intelligence entitlement.
// Owner beta controls are persisted by the server in Supabase. Client flags are
// never authorization. Future premium access reuses the same resolver.

export const ARI_INTELLIGENCE_ENTITLEMENT_VERSION = "1.2.0";

const REASONING_PROFILES = new Set(["adaptive", "economy", "balanced", "deep"]);

export function resolveAriIntelligenceEntitlement({
  userId = "",
  controls = {},
  subscriptionTier = "",
  subscriptionStatus = ""
} = {}) {
  const cleanUserId = String(userId || "").trim().toLowerCase();
  const ownerUserId = String(process.env.ARI_OWNER_USER_ID || "").trim().toLowerCase();
  const ownerEligible = Boolean(cleanUserId && ownerUserId && cleanUserId === ownerUserId);

  // Premium routing remains deliberately disabled until the product is ready.
  // Enabling it later requires both an active premium account and an explicit
  // server environment switch.
  const premiumFeatureEnabled = String(process.env.ARI_PREMIUM_ADVANCED_ENABLED || "").toLowerCase() === "true";
  const normalizedTier = String(subscriptionTier || "").trim().toLowerCase();
  const normalizedStatus = String(subscriptionStatus || "").trim().toLowerCase();
  const premiumEligible = Boolean(
    premiumFeatureEnabled &&
    ["premium", "pro"].includes(normalizedTier) &&
    ["active", "trialing"].includes(normalizedStatus)
  );

  const advancedAllowed = ownerEligible || premiumEligible;
  const requestedAdvanced = controls?.enabled === true;
  const advancedEnabled = advancedAllowed && requestedAdvanced;
  const reasoningProfile = advancedEnabled
    ? normalizeReasoningProfile(controls?.reasoningProfile)
    : "standard";

  // The persistent cognitive-loop experiment is intentionally stricter than
  // Advanced Ari itself. Premium may later receive Advanced Conversation, but
  // cannot enter this experiment until the server contract is deliberately changed.
  const cognitiveLoopAllowed = ownerEligible;
  const cognitiveLoopEnabled = ownerEligible && advancedEnabled;

  return {
    version: ARI_INTELLIGENCE_ENTITLEMENT_VERSION,
    tier: advancedEnabled ? "advanced" : "standard",
    advancedAllowed,
    advancedEnabled,
    ownerEligible,
    premiumEligible,
    reasoningProfile,
    conversationBeta: advancedEnabled,
    cognitiveLoopAllowed,
    cognitiveLoopEnabled,
    cognitiveLoopOwnerOnly: true,
    source: advancedEnabled
      ? ownerEligible ? "owner_beta" : "premium"
      : advancedAllowed ? "eligible_not_enabled" : "standard_default"
  };
}

export function normalizeReasoningProfile(value = "adaptive") {
  const candidate = String(value || "").trim().toLowerCase();
  return REASONING_PROFILES.has(candidate) ? candidate : "adaptive";
}
