// ARI vNext model routing.

export const MODEL_POLICY_VERSION = "1.3.0";

export function resolveModelPolicy(route = {}) {
  const fastModel = process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
  const primaryModel = process.env.OPENAI_ARI_VNEXT_MODEL || "gpt-4o-mini";
  const deepModel = process.env.OPENAI_ARI_VNEXT_DEEP_MODEL || "gpt-5.6-luna";
  // Current/fresh information is a different problem from deep reasoning. Use
  // an economical model that supports the Responses API web_search tool.
  const currentModel = process.env.OPENAI_ARI_VNEXT_CURRENT_MODEL || "gpt-5.4-mini";

  const currentInfo = Boolean(route?.currentInfo);
  const mustUseDeep = Boolean(
    route?.complexity === "deep" ||
    route?.health ||
    route?.developer
  );

  const mustUseStandard = Boolean(
    route?.coachingState ||
    (route?.training && route?.goals) ||
    (route?.training && route?.nutrition) ||
    (route?.nutrition && route?.goals)
  );

  const mode = currentInfo
    ? "current"
    : mustUseDeep
      ? "deep"
      : mustUseStandard
        ? "standard"
        : route?.complexity === "fast"
          ? "fast"
          : "standard";

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
    maxOutputTokens: mode === "deep" ? 2200 : mode === "current" ? 1200 : mode === "standard" ? 1200 : 700,
    timeoutMs: mode === "deep" ? 45000 : mode === "current" ? 25000 : mode === "standard" ? 22000 : 12000,
    costTier: mode === "deep" ? "escalated" : mode === "current" ? "live_search" : "economy",
    liveSearchRequired: currentInfo
  };
}
