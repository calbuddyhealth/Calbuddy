// ARI vNext model routing — Phase 10C adaptive cost/quality policy.
// Model choice controls reasoning cost only. It never controls mutation trust,
// reference authority, confirmation, or execution.

export const MODEL_POLICY_VERSION = "2.4.1";

export function resolveModelPolicy(route = {}) {
  const intelligence = route?.intelligenceEntitlement || null;
  const routing = resolveRoutingClass(route);
  if (intelligence?.advancedEnabled === true) {
    return resolveAdvancedModelPolicy(route, intelligence, routing);
  }

  const fastModel = process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
  const primaryModel = process.env.OPENAI_ARI_VNEXT_MODEL || "gpt-4o-mini";
  const deepModel = process.env.OPENAI_ARI_VNEXT_DEEP_MODEL || "gpt-5.6-luna";
  const currentModel = process.env.OPENAI_ARI_VNEXT_CURRENT_MODEL || "gpt-5.4-mini";
  const nutritionModel = process.env.OPENAI_ARI_NUTRITION_MODEL || "gpt-5.6-luna";

  const mode = resolveWorkMode(route);
  const nutritionLogging = isNutritionLoggingTurn(route);
  const deepRequired = ["high_stakes", "deep_reasoning"].includes(routing.routingClass);
  const model = nutritionLogging
    ? nutritionModel
    : routing.routingClass === "current"
      ? currentModel
      : deepRequired
        ? deepModel
        : routing.fastEligible
          ? fastModel
          : mode === "fast"
            ? fastModel
            : primaryModel;
  const supportsReasoning = isReasoningModel(model);

  return {
    version: MODEL_POLICY_VERSION,
    intelligenceTier: intelligence?.intelligenceTier || "standard",
    accessClass: intelligence?.accessClass || "casual",
    mode,
    model,
    supportsReasoning,
    reasoningEffort: supportsReasoning
      ? nutritionLogging
        ? "low"
        : deepRequired
          ? "high"
          : routing.routingClass === "current"
            ? "low"
            : routing.fastEligible || mode === "fast"
              ? "low"
              : "medium"
      : null,
    maxOutputTokens: nutritionLogging
      ? 1800
      : routing.routingClass === "current"
        ? 1200
        : deepRequired
          ? 2200
          : routing.fastEligible || mode === "fast"
            ? 700
            : 1800,
    timeoutMs: nutritionLogging
      ? 26000
      : routing.routingClass === "current"
        ? 25000
        : deepRequired
          ? 45000
          : routing.fastEligible || mode === "fast"
            ? 12000
            : 26000,
    costTier: nutritionLogging
      ? "nutrition_economy"
      : routing.routingClass === "current"
        ? "live_search"
        : deepRequired
          ? "escalated"
          : "economy",
    liveSearchRequired: Boolean(route?.currentInfo),
    casualConversation: route?.casualConversation === true,
    nutritionResolutionModel: nutritionLogging,
    routingClass: routing.routingClass,
    routingReason: routing.routingReason,
    fastEligible: routing.fastEligible,
    requiresStrongModel: routing.requiresStrongModel,
    escalationAllowed: routing.fastEligible,
    escalationModel: routing.fastEligible ? deepModel : null,
    escalationReason: routing.fastEligible ? "provider_failure_or_trust_repair_only" : null
  };
}

export function resolveRoutingClass(route = {}) {
  const nutritionLogging = isNutritionLoggingTurn(route);
  if (nutritionLogging) {
    return routing("nutrition_logging", "Trusted nutrition logging uses the dedicated interpreter; canonical nutrition truth stays outside the model.", false, false);
  }

  if (route?.currentInfo) {
    return routing("current", "Fresh external information is required, so route to the search-capable current-information path.", false, true);
  }

  if (route?.health) {
    return routing("high_stakes", "Health-related reasoning stays on the stronger path rather than being downgraded for cost.", false, true);
  }

  if (route?.developer || route?.complexity === "deep") {
    return routing("deep_reasoning", "Developer or explicitly deep work requires the stronger reasoning path.", false, true);
  }

  const appDomains = activeAppDomains(route);
  const crossDomain = appDomains.length >= 2;
  if (route?.coachingState || crossDomain) {
    return routing("cross_domain_coaching", "Coaching or cross-domain synthesis must not use the fast path merely because the message is short.", false, true);
  }

  if (route?.casualConversation === true) {
    return routing("casual", "Low-stakes casual conversation is eligible for the fast model.", true, false);
  }

  if (appDomains.length === 1 && route?.complexity === "fast") {
    if (appDomains[0] === "nutrition") {
      return routing("nutrition_advice", "Nutrition advice remains quality-sensitive for Advanced Ari; only routine Nutrition logging uses the dedicated economy interpreter.", false, false);
    }
    return routing("simple_app", `Simple single-domain ${appDomains[0]} work is eligible for the fast model; trust checks remain unchanged.`, true, false);
  }

  if (appDomains.length === 0 && route?.complexity === "fast") {
    return routing("meaningful_conversation", "A short meaningful non-app conversation is not automatically downgraded for Advanced Ari.", false, false);
  }

  return routing("standard", "Ordinary work uses the account tier's standard reasoning path.", false, false);
}

function resolveAdvancedModelPolicy(route = {}, intelligence = {}, routing = resolveRoutingClass(route)) {
  const owner = intelligence?.ownerEligible === true || intelligence?.accessClass === "owner";
  const premium = !owner && (intelligence?.premiumEligible === true || intelligence?.accessClass === "premium");
  const casualConversation = route?.casualConversation === true;
  const nutritionLogging = isNutritionLoggingTurn(route);

  const advancedModel = owner
    ? process.env.OPENAI_ARI_OWNER_MODEL || process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6"
    : process.env.OPENAI_ARI_PREMIUM_MODEL || process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6";
  const fastModel = owner
    ? process.env.OPENAI_ARI_OWNER_FAST_MODEL || process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini"
    : process.env.OPENAI_ARI_PREMIUM_FAST_MODEL || process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
  const nutritionModel = process.env.OPENAI_ARI_NUTRITION_MODEL || "gpt-5.6-luna";

  // Advanced entitlement controls access to the advanced model; it does not mean
  // every trivial app read should spend the flagship model. High-value conversation,
  // Nutrition advice, coaching, deep/current/high-stakes work stays advanced. Bounded
  // simple Training/Goals/Social work and casual chatter can use the fast model without
  // changing trust authority.
  const useFast = !nutritionLogging && routing.fastEligible === true;
  const model = nutritionLogging
    ? nutritionModel
    : useFast
      ? fastModel
      : advancedModel;
  const mode = resolveWorkMode(route);
  const reasoningProfile = normalizeAdvancedReasoningProfile(intelligence?.reasoningProfile);
  const supportsReasoning = isReasoningModel(model);
  const reasoningEffort = supportsReasoning
    ? nutritionLogging
      ? "low"
      : useFast
        ? "low"
        : resolveAdvancedReasoningEffort({ mode, reasoningProfile, route, casualConversation })
    : null;

  return {
    version: MODEL_POLICY_VERSION,
    intelligenceTier: intelligence?.intelligenceTier || (owner ? "owner_experimental" : "premium_advanced"),
    accessClass: intelligence?.accessClass || (owner ? "owner" : premium ? "premium" : "casual"),
    mode,
    model,
    supportsReasoning,
    reasoningProfile,
    reasoningEffort,
    maxOutputTokens: nutritionLogging
      ? 1800
      : useFast
        ? routing.routingClass === "casual" ? 500 : 900
        : mode === "deep"
          ? 3200
          : mode === "current"
            ? 2000
            : mode === "fast"
              ? 1400
              : 2400,
    timeoutMs: nutritionLogging
      ? 26000
      : useFast
        ? 12000
        : reasoningEffort === "xhigh" || reasoningEffort === "max"
          ? 60000
          : mode === "deep"
            ? 50000
            : mode === "fast"
              ? 30000
              : 40000,
    costTier: nutritionLogging
      ? "nutrition_economy"
      : useFast
        ? owner ? "owner_fast" : "premium_fast"
        : owner ? "owner_advanced_sol" : "premium_advanced",
    liveSearchRequired: Boolean(route?.currentInfo),
    conversationBeta: true,
    casualConversation,
    nutritionResolutionModel: nutritionLogging,
    routingClass: routing.routingClass,
    routingReason: routing.routingReason,
    fastEligible: routing.fastEligible,
    requiresStrongModel: routing.requiresStrongModel,
    escalationAllowed: useFast,
    escalationModel: useFast ? advancedModel : null,
    escalationReason: useFast ? "provider_failure_or_trust_repair_only" : null
  };
}

function isNutritionLoggingTurn(route = {}) {
  return Boolean(
    route?.nutrition === true &&
    route?.nutritionLogging === true &&
    route?.training !== true &&
    route?.goals !== true &&
    route?.social !== true &&
    route?.health !== true &&
    route?.developer !== true &&
    route?.currentInfo !== true &&
    route?.coachingState !== true
  );
}

function activeAppDomains(route = {}) {
  return ["nutrition", "training", "goals", "social"]
    .filter((key) => route?.[key] === true);
}

function routing(routingClass, routingReason, fastEligible, requiresStrongModel) {
  return { routingClass, routingReason, fastEligible, requiresStrongModel };
}

function resolveWorkMode(route = {}) {
  const currentInfo = Boolean(route?.currentInfo);
  const mustUseDeep = Boolean(
    route?.complexity === "deep" ||
    route?.health ||
    route?.developer
  );

  const mustUseStandard = Boolean(
    route?.complexity === "standard" ||
    route?.coachingState ||
    (route?.training && route?.goals) ||
    (route?.training && route?.nutrition) ||
    (route?.nutrition && route?.goals)
  );

  return currentInfo
    ? "current"
    : mustUseDeep
      ? "deep"
      : mustUseStandard
        ? "standard"
        : route?.complexity === "fast"
          ? "fast"
          : "standard";
}

function resolveAdvancedReasoningEffort({
  mode = "standard",
  reasoningProfile = "adaptive",
  route = {},
  casualConversation = false
} = {}) {
  if (casualConversation) return "low";
  if (reasoningProfile === "economy") return "low";
  if (reasoningProfile === "balanced") return mode === "fast" ? "low" : "medium";
  if (reasoningProfile === "deep") return "xhigh";
  if (mode === "fast") return "low";
  if (mode === "current") return "low";
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
