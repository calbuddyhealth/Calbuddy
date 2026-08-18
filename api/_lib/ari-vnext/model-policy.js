// ARI vNext — spend model intelligence according to the problem, not every turn.

export const MODEL_POLICY_VERSION = "1.1.0";

export function resolveModelPolicy(route = {}) {
  const fastModel = process.env.OPENAI_ARI_VNEXT_FAST_MODEL || process.env.OPENAI_FAST_MODEL || "gpt-5.6";
  const primaryModel = process.env.OPENAI_ARI_VNEXT_MODEL || process.env.OPENAI_MODEL || "gpt-5.6";
  const deepModel = process.env.OPENAI_ARI_VNEXT_DEEP_MODEL || process.env.OPENAI_REASONING_MODEL || primaryModel;

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

  return {
    version: MODEL_POLICY_VERSION,
    mode,
    model: mode === "deep" ? deepModel : mode === "fast" ? fastModel : primaryModel,
    reasoningEffort: mode === "deep" ? "high" : mode === "standard" ? "medium" : "low",
    maxOutputTokens: mode === "deep" ? 2200 : mode === "standard" ? 1400 : 900,
    timeoutMs: mode === "deep" ? 45000 : mode === "standard" ? 25000 : 14000
  };
}
