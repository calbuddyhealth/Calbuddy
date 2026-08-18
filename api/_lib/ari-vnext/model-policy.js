// ARI vNext model routing.

export const MODEL_POLICY_VERSION = "1.2.0";

export function resolveModelPolicy(route = {}) {
  const fastModel = process.env.OPENAI_ARI_VNEXT_FAST_MODEL || "gpt-4o-mini";
  const primaryModel = process.env.OPENAI_ARI_VNEXT_MODEL || "gpt-4o-mini";
  const deepModel = process.env.OPENAI_ARI_VNEXT_DEEP_MODEL || "gpt-5.6-luna";

  const mustUseDeep = Boolean(
    route?.complexity === "deep" ||
    route?.health ||
    route?.developer ||
    route?.currentInfo
  );

  const mustUseStandard = Boolean(
    route?.coachingState ||
    (route?.training && route?.goals) ||
    (route?.training && route?.nutrition) ||
    (route?.nutrition && route?.goals)
  );

  const mode = mustUseDeep
    ? "deep"
    : mustUseStandard
      ? "standard"
      : route?.complexity === "fast"
        ? "fast"
        : "standard";

  const model = mode === "deep" ? deepModel : mode === "fast" ? fastModel : primaryModel;
  const supportsReasoning = /^gpt-5|^o[0-9]/i.test(String(model));

  return {
    version: MODEL_POLICY_VERSION,
    mode,
    model,
    supportsReasoning,
    reasoningEffort: supportsReasoning ? (mode === "deep" ? "high" : "medium") : null,
    maxOutputTokens: mode === "deep" ? 2200 : mode === "standard" ? 1200 : 700,
    timeoutMs: mode === "deep" ? 45000 : mode === "standard" ? 22000 : 12000,
    costTier: mode === "deep" ? "escalated" : "economy"
  };
}
