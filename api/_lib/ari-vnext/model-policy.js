import { deriveReasoningDemand, resolveOwnerInteractiveModel } from "./cost-router.js";

// ARI vNext model routing.

export const MODEL_POLICY_VERSION = "4.2.0";

export function resolveModelPolicy(route = {}) {
  const intelligence = route?.intelligenceEntitlement || null;
  if (intelligence?.advancedEnabled === true) {
    return resolveAdvancedModelPolicy(route, intelligence);
  }

  // Free Ari is intentionally simple and predictable: one economical model,
  // bounded output, and no automatic escalation to Luna/Terra/Sol.
  const model = process.env.OPENAI_ARI_FREE_MODEL || "gpt-4o-mini";
  const mode = resolveWorkMode(route);
  const freshness = resolveFreshness(route);
  const supportsReasoning = isReasoningModel(model);

  return {
    version: MODEL_POLICY_VERSION,
    intelligenceTier: intelligence?.intelligenceTier || "standard",
    accessClass: intelligence?.accessClass || "casual",
    mode,
    freshness,
    model,
    supportsReasoning,
    reasoningEffort: supportsReasoning ? "low" : null,
    maxOutputTokens: mode === "deep" ? 900 : mode === "standard" ? 700 : 450,
    timeoutMs: mode === "deep" ? 22000 : mode === "standard" ? 18000 : 12000,
    costTier: freshness === "live"
      ? mode === "deep" ? "deep_live_search" : mode === "standard" ? "standard_live_search" : "fast_live_search"
      : "economy",
    liveSearchRequired: freshness === "live",
    escalated: false,
    routingReason: "free_direct",
    modelIdentityRequested: false,
    ownerModelRequest: null,
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
  const baseReasoningDemand = deriveReasoningDemand({
    ...route,
    complexity: mode
  });

  const ariUnlimitedAdvancedModel =
    process.env.OPENAI_ARI_OWNER_MODEL ||
    process.env.OPENAI_ARI_ADVANCED_MODEL ||
    "gpt-5.6-sol";
  const ariUnlimitedFastModel =
    process.env.OPENAI_ARI_OWNER_FAST_MODEL ||
    process.env.OPENAI_ARI_VNEXT_FAST_MODEL ||
    "gpt-5.6-luna";

  const ownerRouting = owner
    ? resolveOwnerInteractiveModel({ mode, route, reasoningProfile })
    : null;
  const reasoningDemand = ownerRouting?.reasoningDemand || baseReasoningDemand;
  const premiumRouting = premium
    ? resolvePremiumInteractiveModel({ mode, route, reasoningProfile, reasoningDemand })
    : null;

  const model = owner
    ? ownerRouting.model
    : ariUnlimited
      ? casualConversation
        ? ariUnlimitedFastModel
        : ariUnlimitedAdvancedModel
      : premiumRouting?.model || "gpt-6-luna";

  const supportsReasoning = isReasoningModel(model);
  const reasoningEffort = supportsReasoning
    ? resolveAdvancedReasoningEffort({
        mode,
        reasoningProfile,
        route,
        casualConversation,
        owner,
        reasoningDemand
      })
    : null;
  const premiumEscalated = premiumRouting?.escalated === true;

  return {
    version: MODEL_POLICY_VERSION,
    intelligenceTier: intelligence?.intelligenceTier || (owner ? "owner_experimental" : ariUnlimited ? "ari_unlimited" : "premium_advanced"),
    accessClass: intelligence?.accessClass || (owner ? "owner" : ariUnlimited ? "ari_unlimited" : premium ? "premium" : "casual"),
    mode,
    freshness,
    model,
    fallbackModel: owner ? ownerRouting?.fallbackModel || null : null,
    supportsReasoning,
    reasoningProfile,
    reasoningEffort,
    reasoningDemand,
    maxOutputTokens: casualConversation
      ? owner
        ? 700
        : 650
      : mode === "deep"
        ? 2400
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
        ? "owner_astra_escalation"
        : "owner_sol_default"
      : ariUnlimited
        ? casualConversation
          ? "ari_unlimited_fast"
          : "ari_unlimited_advanced_sol"
        : premiumEscalated
          ? "premium_sol_escalation"
          : "premium_luna",
    routingReason: owner
      ? ownerRouting?.reason || null
      : premium
        ? premiumRouting?.reason || null
        : ariUnlimited
          ? casualConversation ? "ari_unlimited_fast" : "ari_unlimited_advanced"
          : null,
    escalated: ownerRouting?.escalated === true || premiumEscalated,
    liveSearchRequired: freshness === "live",
    conversationBeta: true,
    ownerModelContinuity: owner,
    modelIdentityRequested: owner && route?.modelIdentityRequested === true,
    ownerModelRequest: owner ? route?.ownerModelRequest || null : null,
    casualConversation
  };
}

function resolvePremiumInteractiveModel({
  mode = "standard",
  route = {},
  reasoningProfile = "adaptive",
  reasoningDemand = null
} = {}) {
  const lunaModel =
    process.env.OPENAI_ARI_PREMIUM_LUNA_MODEL ||
    "gpt-6-luna";
  const solModel =
    process.env.OPENAI_ARI_PREMIUM_SOL_MODEL ||
    "gpt-6.1-sol";

  // Recommendations are intentionally Luna-first. Better evidence, constraints,
  // and ranking should improve recommendation quality before model escalation.
  const recommendationLane = route?.recommendationIntent === true;
  const explicitDeepProfile = cleanReasoningProfile(reasoningProfile) === "deep";
  const hardProblem =
    route?.solEscalationEligible === true &&
    reasoningDemand?.band === "critical";
  const escalate = !recommendationLane && (
    hardProblem ||
    (explicitDeepProfile && mode === "deep")
  );

  return {
    model: escalate ? solModel : lunaModel,
    escalated: escalate,
    reason: escalate
      ? hardProblem
        ? "hard_problem"
        : "explicit_deep_profile"
      : recommendationLane
        ? "luna_recommendation_quality"
        : "luna_default"
  };
}

function cleanReasoningProfile(value = "") {
  return String(value || "").trim().toLowerCase();
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
  owner = false,
  reasoningDemand = null
} = {}) {
  if (casualConversation) return "low";
  if (owner && route?.ownerModelRequest === "astra") return reasoningProfile === "deep" ? "xhigh" : "high";
  if (reasoningProfile === "economy") return "low";
  if (reasoningProfile === "balanced") {
    return reasoningDemand?.band === "low" ? "low" : "medium";
  }
  if (reasoningProfile === "deep") return "xhigh";

  const band = reasoningDemand?.band || (
    mode === "deep" ? "high" : mode === "fast" ? "low" : "medium"
  );
  if (band === "low") return "low";
  if (band === "medium") return "medium";
  if (band === "critical") return owner ? "xhigh" : "high";
  return "high";
}

function normalizeAdvancedReasoningProfile(value = "adaptive") {
  const candidate = String(value || "").trim().toLowerCase();
  return ["adaptive", "economy", "balanced", "deep"].includes(candidate)
    ? candidate
    : "adaptive";
}

function isReasoningModel(value = "") {
  return /^gpt-(?:5|6)|^o[0-9]/i.test(String(value || ""));
}
