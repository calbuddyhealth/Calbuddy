// ARI vNext model routing.

export const MODEL_POLICY_VERSION = "2.0.0";

export function resolveModelPolicy(route = {}) {
  const intelligence = route?.intelligenceEntitlement || null;
  if (intelligence?.advancedEnabled === true) {
    return resolveAdvancedModelPolicy(route, intelligence);
  }

  const fastModel = process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
  const primaryModel = process.env.OPENAI_ARI_VNEXT_MODEL || "gpt-4o-mini";
  const deepModel = process.env.OPENAI_ARI_VNEXT_DEEP_MODEL || "gpt-5.6-luna";
  // Current/fresh information is a different problem from deep reasoning. Use
  // an economical model that supports the Responses API web_search tool.
  const currentModel = process.env.OPENAI_ARI_VNEXT_CURRENT_MODEL || "gpt-5.4-mini";

  const mode = resolveWorkMode(route);
  const model = mode === "current"
    ? currentModel
    : mode === "deep"
      ? deepModel
      : mode === "fast"
        ? fastModel
        : primaryModel;
  const supportsReasoning = /^gpt-5|^o[0-9]/i.test(String(model));

  return {
    version: MODEL_POLICY_VERSION,
    intelligenceTier: "standard",
    mode,
    model,
    supportsReasoning,
    reasoningEffort: supportsReasoning
      ? mode === "deep"
        ? "high"
        : mode === "current"
          ? "low"
          : "medium"
      : null,
    // Standard GPT-4o-mini turns get enough room for structured workout/meal
    // proposals without escalating routine planning to an expensive model.
    maxOutputTokens: mode === "deep" ? 2200 : mode === "current" ? 1200 : mode === "standard" ? 1800 : 700,
    timeoutMs: mode === "deep" ? 45000 : mode === "current" ? 25000 : mode === "standard" ? 26000 : 12000,
    costTier: mode === "deep" ? "escalated" : mode === "current" ? "live_search" : "economy",
    liveSearchRequired: Boolean(route?.currentInfo)
  };
}

function resolveAdvancedModelPolicy(route = {}, intelligence = {}) {
  // Owner beta intentionally uses the flagship GPT-5.6 alias (GPT-5.6 Sol).
  // Premium can later override this independently if a different price/performance
  // point is desirable without changing the conversation architecture.
  const model = process.env.OPENAI_ARI_ADVANCED_MODEL || "gpt-5.6";
  const mode = resolveWorkMode(route);
  const reasoningProfile = normalizeAdvancedReasoningProfile(intelligence?.reasoningProfile);
  const reasoningEffort = resolveAdvancedReasoningEffort({ mode, reasoningProfile, route });

  return {
    version: MODEL_POLICY_VERSION,
    intelligenceTier: "advanced",
    mode,
    model,
    supportsReasoning: true,
    reasoningProfile,
    reasoningEffort,
    maxOutputTokens: mode === "deep" ? 3200 : mode === "current" ? 2000 : mode === "fast" ? 1000 : 2400,
    timeoutMs: reasoningEffort === "xhigh" || reasoningEffort === "max"
      ? 60000
      : mode === "deep"
        ? 50000
        : mode === "fast"
          ? 22000
          : 40000,
    costTier: "owner_advanced_sol",
    liveSearchRequired: Boolean(route?.currentInfo),
    conversationBeta: true
  };
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

function resolveAdvancedReasoningEffort({ mode = "standard", reasoningProfile = "adaptive", route = {} } = {}) {
  if (reasoningProfile === "economy") return "low";
  if (reasoningProfile === "balanced") return mode === "fast" ? "low" : "medium";
  if (reasoningProfile === "deep") return "xhigh";

  // Adaptive is the owner-beta default: quick conversation gets a small amount
  // of thought while complex coaching, health, and developer work receives more.
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
