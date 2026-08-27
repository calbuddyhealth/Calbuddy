// ARI vNext model routing.

export const MODEL_POLICY_VERSION = "2.2.0";

export function resolveModelPolicy(route = {}) {
  const intelligence = route?.intelligenceEntitlement || null;
  if (intelligence?.advancedEnabled === true) {
    return resolveAdvancedModelPolicy(route, intelligence);
  }

  const fastModel = process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
  const primaryModel = process.env.OPENAI_ARI_VNEXT_MODEL || "gpt-4o-mini";
  const deepModel = process.env.OPENAI_ARI_VNEXT_DEEP_MODEL || "gpt-5.6-luna";
  const currentModel = process.env.OPENAI_ARI_VNEXT_CURRENT_MODEL || "gpt-5.4-mini";
  const nutritionModel = process.env.OPENAI_ARI_NUTRITION_MODEL || "gpt-5.6-luna";

  const mode = resolveWorkMode(route);
  const nutritionOnly = isNutritionOnlyTurn(route);
  const model = nutritionOnly
    ? nutritionModel
    : mode === "current"
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
    model,
    supportsReasoning,
    reasoningEffort: supportsReasoning
      ? nutritionOnly
        ? "low"
        : mode === "deep"
          ? "high"
          : mode === "current"
            ? "low"
            : "medium"
      : null,
    maxOutputTokens: nutritionOnly ? 1800 : mode === "deep" ? 2200 : mode === "current" ? 1200 : mode === "standard" ? 1800 : 700,
    timeoutMs: nutritionOnly ? 26000 : mode === "deep" ? 45000 : mode === "current" ? 25000 : mode === "standard" ? 26000 : 12000,
    costTier: nutritionOnly ? "nutrition_economy" : mode === "deep" ? "escalated" : mode === "current" ? "live_search" : "economy",
    liveSearchRequired: Boolean(route?.currentInfo),
    casualConversation: route?.casualConversation === true,
    nutritionResolutionModel: nutritionOnly
  };
}

function resolveAdvancedModelPolicy(route = {}, intelligence = {}) {
  const owner = intelligence?.ownerEligible === true || intelligence?.accessClass === "owner";
  const premium = !owner && (intelligence?.premiumEligible === true || intelligence?.accessClass === "premium");
  const casualConversation = route?.casualConversation === true;
  const nutritionOnly = isNutritionOnlyTurn(route);

  const advancedModel = owner
    ? process.env.OPENAI_ARI_OWNER_MODEL || process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6"
    : process.env.OPENAI_ARI_PREMIUM_MODEL || process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6";
  const fastModel = owner
    ? process.env.OPENAI_ARI_OWNER_FAST_MODEL || process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini"
    : process.env.OPENAI_ARI_PREMIUM_FAST_MODEL || process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
  const nutritionModel = process.env.OPENAI_ARI_NUTRITION_MODEL || "gpt-5.6-luna";

  // Advanced conversational/coaching work remains on the advanced model. A
  // Nutrition-only turn uses the dedicated economy interpreter because the
  // trusted resolver, not the language model, determines nutrition truth.
  const model = nutritionOnly
    ? nutritionModel
    : casualConversation
      ? fastModel
      : advancedModel;
  const mode = resolveWorkMode(route);
  const reasoningProfile = normalizeAdvancedReasoningProfile(intelligence?.reasoningProfile);
  const supportsReasoning = isReasoningModel(model);
  const reasoningEffort = supportsReasoning
    ? nutritionOnly
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
    maxOutputTokens: nutritionOnly
      ? 1800
      : casualConversation
        ? 500
        : mode === "deep"
          ? 3200
          : mode === "current"
            ? 2000
            : mode === "fast"
              ? 1400
              : 2400,
    timeoutMs: nutritionOnly
      ? 26000
      : casualConversation
        ? 12000
        : reasoningEffort === "xhigh" || reasoningEffort === "max"
          ? 60000
          : mode === "deep"
            ? 50000
            : mode === "fast"
              ? 30000
              : 40000,
    costTier: nutritionOnly
      ? "nutrition_economy"
      : casualConversation
        ? owner ? "owner_fast" : "premium_fast"
        : owner ? "owner_advanced_sol" : "premium_advanced",
    liveSearchRequired: Boolean(route?.currentInfo),
    conversationBeta: true,
    casualConversation,
    nutritionResolutionModel: nutritionOnly
  };
}

function isNutritionOnlyTurn(route = {}) {
  return Boolean(
    route?.nutrition === true &&
    route?.training !== true &&
    route?.goals !== true &&
    route?.social !== true &&
    route?.health !== true &&
    route?.developer !== true &&
    route?.currentInfo !== true &&
    route?.coachingState !== true
  );
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
