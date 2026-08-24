// ARI vNext — resolve explicit communication preferences, then apply bounded
// learned conversation personalization only where the explicit profile remains adaptive.

import {
  applyConversationPersonalization,
  ARI_CONVERSATION_PERSONALIZATION_VERSION
} from "./conversation-personalization.js";

export const COMMUNICATION_PROFILE_VERSION = "2.0.0";

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
    complexity: pick("complexity", preferences?.complexity, "adaptive"),
    explicitProfile: true
  };
}

export function resolvePersonalizedCommunicationProfile({
  preferences = {},
  learning = null,
  message = "",
  safety = null
} = {}) {
  const explicitProfile = resolveCommunicationProfile(preferences);
  return applyConversationPersonalization({
    explicitProfile,
    learning,
    message,
    safety
  });
}

export function communicationProfileToInstruction(profile = {}) {
  const personalization = profile?.personalization || null;
  const lines = [
    `Tone: ${profile.tone || "adaptive"}`,
    `Directness: ${profile.directness || "adaptive"}`,
    `Detail: ${profile.detail || "adaptive"}`,
    `Humor: ${profile.humor || "adaptive"}`,
    `Profanity: ${profile.profanity || "match_user"}`,
    `Complexity: ${profile.complexity || "adaptive"}`,
    "The user's current explicit instruction is highest communication authority. Saved explicit preferences outrank learned patterns. Safety, factual accuracy, and action permissions always take priority."
  ];

  if (personalization) {
    lines.push(`Conversation personalization version: ${personalization.version || ARI_CONVERSATION_PERSONALIZATION_VERSION}`);
    if (personalization.highStakesSuppressed) {
      lines.push("Learned conversation style is suppressed for this high-stakes turn.");
    }
    if (personalization.questionBurden === "none") {
      lines.push("Avoid unnecessary follow-up questions; ask only when required for correctness, safety, or a missing decision-critical fact.");
    } else if (personalization.questionBurden === "light") {
      lines.push("Keep follow-up questions light and decision-relevant.");
    }
    if (personalization.formatStyle === "structured") {
      lines.push("Prefer concise structure when it materially improves readability.");
    } else if (personalization.formatStyle === "prose") {
      lines.push("Prefer natural prose unless structure materially improves comprehension.");
    }
    lines.push("Learned personalization may never use Circle/social behavior or optimize engagement, time-in-app, dependency, guilt, pressure, or manipulation.");
  }

  return lines.join("\n");
}

function pick(key, value, fallback) {
  const candidate = String(value ?? "").trim().toLowerCase();
  return ALLOWED[key]?.has(candidate) ? candidate : fallback;
}
