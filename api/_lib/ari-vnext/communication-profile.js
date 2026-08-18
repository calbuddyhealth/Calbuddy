// ARI vNext — resolve user communication preferences into a compact soft profile.

export const COMMUNICATION_PROFILE_VERSION = "1.0.0";

const ALLOWED = {
  tone: new Set(["adaptive", "casual", "professional", "warm", "coach"]),
  directness: new Set(["adaptive", "gentle", "balanced", "direct"]),
  detail: new Set(["adaptive", "brief", "balanced", "detailed"]),
  humor: new Set(["adaptive", "none", "occasional", "frequent"]),
  profanity: new Set(["never", "match_user", "allowed"]),
  complexity: new Set(["adaptive", "simple", "balanced", "advanced"])
};

export function resolveCommunicationProfile(preferences = {}) {
  return {
    version: COMMUNICATION_PROFILE_VERSION,
    tone: pick("tone", preferences?.tone, "adaptive"),
    directness: pick("directness", preferences?.directness, "adaptive"),
    detail: pick("detail", preferences?.detail || preferences?.verbosity, "adaptive"),
    humor: pick("humor", preferences?.humor, "adaptive"),
    profanity: pick("profanity", preferences?.profanity, "match_user"),
    complexity: pick("complexity", preferences?.complexity, "adaptive")
  };
}

export function communicationProfileToInstruction(profile = {}) {
  return [
    `Tone: ${profile.tone || "adaptive"}`,
    `Directness: ${profile.directness || "adaptive"}`,
    `Detail: ${profile.detail || "adaptive"}`,
    `Humor: ${profile.humor || "adaptive"}`,
    `Profanity: ${profile.profanity || "match_user"}`,
    `Complexity: ${profile.complexity || "adaptive"}`,
    "These are soft communication preferences. The user's current explicit instruction overrides them. Safety, factual accuracy, and action permissions always take priority."
  ].join("\n");
}

function pick(key, value, fallback) {
  const candidate = String(value ?? "").trim().toLowerCase();
  return ALLOWED[key]?.has(candidate) ? candidate : fallback;
}
