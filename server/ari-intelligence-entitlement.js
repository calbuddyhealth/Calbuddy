// ARI XP — server-authoritative intelligence entitlement.
// Account role, subscription state, and intelligence strength are intentionally
// separate so owner privileges can never be inferred from a paid subscription.

export const ARI_INTELLIGENCE_ENTITLEMENT_VERSION = "1.3.0";

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
  const premiumEligible = Boolean(
    premiumFeatureEnabled &&
    ["premium", "pro"].includes(normalizedTier) &&
    ["active", "trialing"].includes(normalizedStatus)
  );

  const advancedAllowed = ownerEligible || premiumEligible;
  // Owner Mode retains an explicit server-side beta switch. A premium subscriber
  // receives Premium Advanced automatically once the product-level feature flag
  // is enabled and the commercial entitlement is active.
  const requestedAdvanced = ownerEligible ? controls?.enabled === true : premiumEligible;
  const advancedEnabled = advancedAllowed && requestedAdvanced;
  const reasoningProfile = advancedEnabled
    ? normalizeReasoningProfile(controls?.reasoningProfile)
    : "standard";

  const accountRole = ownerEligible ? "owner" : "user";
  const accessClass = ownerEligible ? "owner" : premiumEligible ? "premium" : "casual";
  const intelligenceTier = advancedEnabled
    ? ownerEligible ? "owner_experimental" : "premium_advanced"
    : "standard";

  // Owner cognitive state is an administrative/development capability. Premium
  // intelligence must never inherit this simply because the subscriber pays.
  const cognitiveLoopAllowed = ownerEligible;
  const cognitiveLoopEnabled = ownerEligible && advancedEnabled;

  return {
    version: ARI_INTELLIGENCE_ENTITLEMENT_VERSION,

    // Backward-compatible coarse tier used by existing telemetry/UI.
    tier: advancedEnabled ? "advanced" : "standard",

    // Explicitly separated entitlement dimensions.
    accountRole,
    subscriptionTier: normalizedTier,
    subscriptionStatus: normalizedStatus,
    accessClass,
    intelligenceTier,

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
      : ownerEligible
        ? "owner_standard"
        : premiumEligible
          ? "premium_standard"
          : "standard_default"
  };
}

export function normalizeReasoningProfile(value = "adaptive") {
  const candidate = String(value || "").trim().toLowerCase();
  return REASONING_PROFILES.has(candidate) ? candidate : "adaptive";
}
