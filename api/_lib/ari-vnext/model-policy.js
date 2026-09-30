import { resolveOwnerInteractiveModel } from "./cost-router.js";

// ARI vNext model routing.

export const MODEL_POLICY_VERSION = "3.0.0";

export function resolveModelPolicy(route = {}) {
  const intelligence = route?.intelligenceEntitlement || null;
  if (intelligence?.advancedEnabled === true) {
    return resolveAdvancedModelPolicy(route, intelligence);
  }

  const fastModel = process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
  const primaryModel = process.env.OPENAI_ARI_VNEXT_MODEL || "gpt-4o-mini";
  const deepModel = process.env.OPENAI_ARI_VNEXT_DEEP_MODEL || "gpt-5.6-luna";
  const currentModel = process.env.OPENAI_ARI_VNEXT_CURRENT_MODEL || "gpt-5.4-mini";

  const mode = resolveWorkMode(route);
  const freshness = resolveFreshness(route);
  const model = freshness === "live"
    ? currentModel
    : mode === "deep"
      ? deepModel
      : mode === "fast"
        ? fastModel
        : primaryModel;
  const supportsReasoning = isReasoningModel(model);

  return {
    version: MODEL_POLICY_VERSION,
    intelligenceTier: intelligence?.intelligenceTier || "standard",
    accessClass: intelligence?.accessClass || "casual",
    mode,
    freshness,
    model,
    supportsReasoning,
    reasoningEffort: supportsReasoning
      ? mode === "deep"
        ? "high"
        : mode === "fast"
          ? "low"
          : "medium"
      : null,
    maxOutputTokens: mode === "deep" ? 2200 : mode === "standard" ? 1800 : 700,
    timeoutMs: mode === "deep" ? 45000 : mode === "standard" ? 26000 : 12000,
    costTier: freshness === "live"
      ? mode === "deep" ? "deep_live_search" : mode === "standard" ? "standard_live_search" : "fast_live_search"
      : mode === "deep" ? "escalated" : "economy",
    liveSearchRequired: freshness === "live",
    casualConversation: route?.casualConversation === true
  };
}

function resolveAdvancedModelPolicy(route = {}, intelligence = {}) {
  const owner = intelligence?.ownerEligible === true || intelligence?.accessClass === "owner";
  const ariUnlimited = !owner && (
    intelligence?.ariUnlimitedEligible === true ||
    intelligence?.accessClass === "ari_unlimited"
  );
  const premium = !owner && !ariUnlimited && (
    intelligence?.premiumEligible === true ||
    intelligence?.accessClass === "premium"
  );
  const casualConversation = route?.casualConversation === true;
  const mode = resolveWorkMode(route);
  const freshness = resolveFreshness(route);
  const reasoningProfile = normalizeAdvancedReasoningProfile(intelligence?.reasoningProfile);

  const ariUnlimitedAdvancedModel =
    process.env.OPENAI_ARI_OWNER_MODEL ||
    process.env.OPENAI_ARI_ADVANCED_MODEL ||
    "gpt-5.6-sol";
  const ariUnlimitedFastModel =
    process.env.OPENAI_ARI_OWNER_FAST_MODEL ||
    process.env.OPENAI_ARI_VNEXT_FAST_MODEL ||
    "gpt-5.6-luna";
  const premiumAdvancedModel =
    process.env.OPENAI_ARI_PREMIUM_MODEL ||
    process.env.OPENAI_ARI_ADVANCED_MODEL ||
    "gpt-5.6-terra";
  const premiumFastModel =
    process.env.OPENAI_ARI_PREMIUM_FAST_MODEL ||
    process.env.OPENAI_ARI_VNEXT_FAST_MODEL ||
    "gpt-5.6-luna";

  const ownerRouting = owner
    ? resolveOwnerInteractiveModel({ mode, route, reasoningProfile })
    : null;

  const model = owner
    ? ownerRouting.model
    : ariUnlimited
      ? casualConversation
        ? ariUnlimitedFastModel
        : ariUnlimitedAdvancedModel
      : casualConversation
        ? premiumFastModel
        : premiumAdvancedModel;

  const supportsReasoning = isReasoningModel(model);
  const reasoningEffort = supportsReasoning
    ? resolveAdvancedReasoningEffort({ mode, reasoningProfile, route, casualConversation, owner })
    : null;

  return {
    version: MODEL_POLICY_VERSION,
    intelligenceTier: intelligence?.intelligenceTier || (owner ? "owner_experimental" : ariUnlimited ? "ari_unlimited" : "premium_advanced"),
    accessClass: intelligence?.accessClass || (owner ? "owner" : ariUnlimited ? "ari_unlimited" : premium ? "premium" : "casual"),
    mode,
    freshness,
    model,
    supportsReasoning,
    reasoningProfile,
    reasoningEffort,
    maxOutputTokens: casualConversation
      ? owner
        ? 700
        : 500
      : mode === "deep"
        ? 2800
        : mode === "fast"
          ? 1100
          : 1800,
    timeoutMs: casualConversation
      ? 16000
      : reasoningEffort === "xhigh" || reasoningEffort === "max"
        ? 60000
        : mode === "deep"
          ? 50000
          : mode === "fast"
            ? 24000
            : 34000,
    costTier: owner
      ? ownerRouting?.escalated
        ? "owner_sol_escalation"
        : "owner_terra_default"
      : casualConversation
        ? ariUnlimited
          ? "ari_unlimited_fast"
          : "premium_fast"
        : ariUnlimited
          ? "ari_unlimited_advanced_sol"
          : "premium_advanced",
    routingReason: ownerRouting?.reason || null,
    escalated: ownerRouting?.escalated === true,
    liveSearchRequired: freshness === "live",
    conversationBeta: true,
    ownerModelContinuity: owner,
    casualConversation
  };
}

function resolveWorkMode(route = {}) {
  const mustUseDeep = Boolean(
    route?.complexity === "deep" ||
    route?.health
  );

  const mustUseStandard = Boolean(
    route?.complexity === "standard" ||
    route?.developer ||
    route?.coachingState ||
    (route?.training && route?.goals) ||
    (route?.training && route?.nutrition) ||
    (route?.nutrition && route?.goals)
  );

  return mustUseDeep
    ? "deep"
    : mustUseStandard
      ? "standard"
      : route?.complexity === "fast"
        ? "fast"
        : "standard";
}

function resolveFreshness(route = {}) {
  return route?.currentInfo === true ? "live" : "static";
}

function resolveAdvancedReasoningEffort({
  mode = "standard",
  reasoningProfile = "adaptive",
  route = {},
  casualConversation = false,
  owner = false
} = {}) {
  if (casualConversation) return "low";
  if (reasoningProfile === "economy") return "low";
  if (reasoningProfile === "balanced") return mode === "fast" ? "low" : "medium";
  if (reasoningProfile === "deep") return "xhigh";
  if (mode === "fast") return "low";
  if (mode === "deep" || route?.health || route?.developer) return "high";
  return "medium";
}

function normalizeAdvancedReasoningProfile(value = "adaptive") {
  const candidate = String(value || "").trim().toLowerCase();
  return ["adaptive", "economy", "balanced", "deep"].includes(candidate)
    ? candidate
    : "adaptive";
}

function isReasoningModel(value = "") {
  return /^gpt-5|^o[0-9]/i.test(String(value || ""));
}
