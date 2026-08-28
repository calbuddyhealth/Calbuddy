// ARI vNext — Phase 9C bounded compound-language parsing.
//
// This module deliberately does not authorize or execute mutations. The Phase
// 9C orchestrator wrapper sends each resulting clause through the mature Ari
// single-action orchestration path independently, which remains the one server
// authority for routing, semantic intent review, reference resolution, and tool
// validation.

export const COMPOUND_ACTION_VERSION = "1.0.0";
export const MAX_COMPOUND_ACTIONS = 4;

const ACTION_VERB = "(?:log|record|save|add|change|update|edit|correct|fix|remove|delete|undo|discard|replace|swap|move|set|make|clear|cancel)";

export function splitCompoundActionClauses(message = "", expectedCount = 0) {
  const text = clean(message, 1800);
  if (!text) return [];

  let clauses = text
    .split(/\s*(?:;|,\s*(?:and\s+)?then\b|\band\s+then\b|\bthen\b)\s*/i)
    .map((part) => clean(part, 700))
    .filter(Boolean);

  if (expectedCount > 1 && clauses.length < expectedCount) {
    clauses = text
      .split(new RegExp(`\\s*(?:,|\\band\\b)\\s+(?=${ACTION_VERB}\\b)`, "i"))
      .map((part) => clean(part, 700))
      .filter(Boolean);
  }

  return clauses;
}

function clean(value = "", max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
