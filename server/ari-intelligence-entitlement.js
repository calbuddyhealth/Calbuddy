// ARI XP — server-authoritative intelligence entitlement.
// Account role, subscription state, and intelligence strength are intentionally
// separate so owner privileges can never be inferred from a paid subscription.

export const ARI_INTELLIGENCE_ENTITLEMENT_VERSION = "1.4.0";

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

  const premiumFeatureEnabled = String(process.env.ARI_PREMIUM_ADVANCED_ENABLED || "")
    .trim()
    .toLowerCase() === "true";
  const normalizedTier = String(subscriptionTier || "").trim().toLowerCase() || "free";
  const normalizedStatus = String(subscriptionStatus || "").trim().toLowerCase() || "unknown";
  const ariUnlimitedEligible = Boolean(
    normalizedTier === "ari_unlimited" &&
    ["active", "trialing"].includes(normalizedStatus)
  );
  const premiumEligible = Boolean(
    premiumFeatureEnabled &&
    ["premium", "pro"].includes(normalizedTier) &&
    ["active", "trialing"].includes(normalizedStatus)
  );

  const advancedAllowed = ownerEligible || ariUnlimitedEligible || premiumEligible;
  // Owner Mode retains an explicit server-side beta switch. Ari Unlimited and
  // Premium Advanced enable chat intelligence without inheriting owner powers.
  const requestedAdvanced = ownerEligible ? controls?.enabled === true : (ariUnlimitedEligible || premiumEligible);
  const advancedEnabled = advancedAllowed && requestedAdvanced;
  const reasoningProfile = advancedEnabled
    ? normalizeReasoningProfile(controls?.reasoningProfile)
    : "standard";

  const accountRole = ownerEligible ? "owner" : "user";
  const accessClass = ownerEligible
    ? "owner"
    : ariUnlimitedEligible
      ? "ari_unlimited"
      : premiumEligible
        ? "premium"
        : "casual";
  const intelligenceTier = advancedEnabled
    ? ownerEligible
      ? "owner_experimental"
      : ariUnlimitedEligible
        ? "ari_unlimited"
        : "premium_advanced"
    : "standard";

  // Owner cognitive state is an administrative/development capability. Neither
  // Ari Unlimited nor paid intelligence may inherit it.
  const cognitiveLoopAllowed = ownerEligible;
  const cognitiveLoopEnabled = ownerEligible && advancedEnabled;

  return {
    version: ARI_INTELLIGENCE_ENTITLEMENT_VERSION,
    tier: advancedEnabled ? "advanced" : "standard",
    accountRole,
    subscriptionTier: normalizedTier,
    subscriptionStatus: normalizedStatus,
    accessClass,
    intelligenceTier,
    advancedAllowed,
    advancedEnabled,
    ownerEligible,
    ariUnlimitedEligible,
    premiumEligible,
    reasoningProfile,
    conversationBeta: advancedEnabled,
    cognitiveLoopAllowed,
    cognitiveLoopEnabled,
    cognitiveLoopOwnerOnly: true,
    source: advancedEnabled
      ? ownerEligible
        ? "owner_beta"
        : ariUnlimitedEligible
          ? "ari_unlimited"
          : "premium"
      : advancedAllowed
        ? "eligible_not_enabled"
        : "standard_default"
  };
}

export function normalizeReasoningProfile(value = "adaptive") {
  const candidate = String(value || "").trim().toLowerCase();
  return REASONING_PROFILES.has(candidate) ? candidate : "adaptive";
}
