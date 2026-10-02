// ARI — master switch for all background AI / worker execution.
// Intentionally defaults OFF. Interactive Ari chat is unaffected.

export const ARI_BACKGROUND_AI_SWITCH_VERSION = "1.0.0";

export function isBackgroundAiEnabled() {
  return envTrue("ARI_BACKGROUND_AI_ENABLED", false);
}

export function isBackgroundWorkerEnabled(envName = "") {
  if (!isBackgroundAiEnabled()) return false;
  if (!envName) return true;
  return envTrue(envName, false);
}

export function backgroundAiDisabledReason(envName = "") {
  if (!isBackgroundAiEnabled()) return "background_ai_master_disabled";
  if (envName && !envTrue(envName, false)) return `${String(envName).toLowerCase()}_disabled`;
  return null;
}

function envTrue(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || String(raw).trim() === "") return fallback;
  return String(raw).trim().toLowerCase() === "true";
}
