// ARI XP — server-authoritative intelligence entitlement foundation.
// Owner beta is enabled by an HttpOnly preference cookie only after owner auth.
// Future premium access can reuse this resolver without changing the client contract.

export const ARI_INTELLIGENCE_ENTITLEMENT_VERSION = "1.0.0";
export const ARI_INTELLIGENCE_COOKIE = "ari_xp_advanced_ari";
export const ARI_REASONING_COOKIE = "ari_xp_reasoning_profile";

const REASONING_PROFILES = new Set(["adaptive", "economy", "balanced", "deep"]);

export function readIntelligenceControlCookies(req = {}) {
  const cookies = parseCookies(req?.headers?.cookie || "");
  return {
    enabled: cookies[ARI_INTELLIGENCE_COOKIE] === "1",
    reasoningProfile: normalizeReasoningProfile(cookies[ARI_REASONING_COOKIE])
  };
}

export function buildIntelligenceControlCookies({ enabled = false, reasoningProfile = "adaptive" } = {}) {
  const maxAge = 60 * 60 * 24 * 30;
  const common = `Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
  return [
    `${ARI_INTELLIGENCE_COOKIE}=${enabled ? "1" : "0"}; ${common}`,
    `${ARI_REASONING_COOKIE}=${encodeURIComponent(normalizeReasoningProfile(reasoningProfile))}; ${common}`
  ];
}

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

  return {
    version: ARI_INTELLIGENCE_ENTITLEMENT_VERSION,
    tier: advancedEnabled ? "advanced" : "standard",
    advancedAllowed,
    advancedEnabled,
    ownerEligible,
    premiumEligible,
    reasoningProfile,
    conversationBeta: advancedEnabled,
    source: advancedEnabled
      ? ownerEligible ? "owner_beta" : "premium"
      : advancedAllowed ? "eligible_not_enabled" : "standard_default"
  };
}

export function normalizeReasoningProfile(value = "adaptive") {
  const candidate = String(value || "").trim().toLowerCase();
  return REASONING_PROFILES.has(candidate) ? candidate : "adaptive";
}

function parseCookies(header = "") {
  const output = {};
  for (const piece of String(header || "").split(";")) {
    const index = piece.indexOf("=");
    if (index <= 0) continue;
    const key = piece.slice(0, index).trim();
    const raw = piece.slice(index + 1).trim();
    if (!key) continue;
    try {
      output[key] = decodeURIComponent(raw);
    } catch {
      output[key] = raw;
    }
  }
  return output;
}
