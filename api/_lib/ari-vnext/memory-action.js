import { persistDurableMemory } from "./continuity-service.js";

export const ARI_MEMORY_ACTION_VERSION = "1.0.0";

const TRIGGER_PATTERN = /\b(?:please\s+)?(remember(?:\s+that)?|don['’]?t\s+forget(?:\s+that)?|do\s+not\s+forget(?:\s+that)?|keep\s+in\s+mind(?:\s+that)?)\b/i;
const FOLLOWUP_REQUEST_PATTERN = /\b(?:and|also|then)\s+(?:tell|explain|answer|show|give|help|what|why|how|can|could|would|should|do)\b/i;

export function prepareExplicitMemoryAction(message = "") {
  const raw = String(message ?? "").replace(/\r\n?/g, "\n").trim();
  const match = TRIGGER_PATTERN.exec(raw);

  if (!match) return emptyAction("not_requested");

  const content = raw
    .slice((match.index || 0) + match[0].length)
    .replace(/^\s*[:\-–—]\s*/, "")
    .trim();

  const facts = splitMemoryFacts(content);
  const triggerNearStart = (match.index || 0) <= 40;
  const hasQuestion = /\?/.test(content);
  const hasFollowupRequest = FOLLOWUP_REQUEST_PATTERN.test(content);

  return {
    version: ARI_MEMORY_ACTION_VERSION,
    requested: true,
    memoryOnly: Boolean(triggerNearStart && facts.length && !hasQuestion && !hasFollowupRequest),
    requestedCount: facts.length,
    storedCount: 0,
    failedCount: 0,
    status: facts.length ? "pending" : "no_facts",
    facts,
    results: [],
    persistentMemoryAvailable: true,
    source: "ari_vnext_verified_memory_action"
  };
}

export async function executeExplicitMemoryAction({
  userId,
  message,
  history = [],
  route = {},
  privacyControls = null
} = {}) {
  const prepared = prepareExplicitMemoryAction(message);
  if (!prepared.requested || !prepared.facts.length) return prepared;

  const results = await Promise.all(
    prepared.facts.map(async (fact) => {
      try {
        const result = await persistDurableMemory({
          userId,
          message: `remember that ${fact}`,
          history,
          route,
          privacyControls
        });

        return {
          fact,
          stored: result?.stored === true,
          reason: result?.reason || null,
          category: result?.category || null
        };
      } catch (error) {
        return {
          fact,
          stored: false,
          reason: error?.message || "memory_write_exception",
          category: null
        };
      }
    })
  );

  const storedCount = results.filter((item) => item.stored).length;
  const failedCount = Math.max(0, results.length - storedCount);
  const status = storedCount === results.length
    ? "stored"
    : storedCount > 0
      ? "partial"
      : "failed";

  return {
    ...prepared,
    storedCount,
    failedCount,
    status,
    results
  };
}

export function buildVerifiedMemoryReply(action = {}) {
  const requestedCount = Math.max(0, Number(action?.requestedCount || 0));
  const storedCount = Math.max(0, Number(action?.storedCount || 0));
  const failedCount = Math.max(0, Number(action?.failedCount || 0));

  if (!action?.requested) return "";

  if (!requestedCount) {
    return "I can save something to persistent memory, but I need the detail you want me to remember.";
  }

  if (action?.status === "stored") {
    return storedCount === 1
      ? "Got it — I saved that to your persistent memory."
      : `Got it — I saved ${storedCount} details to your persistent memory.`;
  }

  if (action?.status === "partial") {
    return `I saved ${storedCount} of ${requestedCount} details to your persistent memory. ${failedCount} could not be saved just now.`;
  }

  return requestedCount === 1
    ? "I have persistent memory, but I couldn’t save that detail just now."
    : `I have persistent memory, but I couldn’t save those ${requestedCount} details just now.`;
}

export function buildMemoryActionModelNote(action = {}) {
  if (!action?.requested) return "";

  return [
    "VERIFIED ARI MEMORY ACTION",
    "Persistent user memory is available in this runtime.",
    `This turn requested ${Number(action.requestedCount || 0)} memory item(s).`,
    `Verified save status: ${String(action.status || "unknown")}.`,
    `Stored: ${Number(action.storedCount || 0)}. Failed: ${Number(action.failedCount || 0)}.`,
    "Do not claim that persistent memory or a memory-save capability is unavailable.",
    "If discussing this memory request, describe only the verified save result above."
  ].join("\n");
}

function splitMemoryFacts(content = "") {
  const raw = String(content ?? "").trim();
  if (!raw) return [];

  let parts = raw
    .split(/\n+/)
    .map(stripListPrefix)
    .filter(Boolean);

  if (parts.length === 1 && raw.includes(";")) {
    parts = raw.split(/\s*;\s*/).map(stripListPrefix).filter(Boolean);
  }

  return Array.from(new Set(
    parts
      .map((value) => cleanFact(value))
      .filter((value) => value.length >= 2)
  )).slice(0, 10);
}

function stripListPrefix(value = "") {
  return String(value)
    .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
    .trim();
}

function cleanFact(value = "") {
  return String(value)
    .replace(/^\s*(?:that\s+)?/i, "")
    .replace(/\s+/g, " ")
    .replace(/[\s.;,:]+$/g, "")
    .trim()
    .slice(0, 900);
}

function emptyAction(reason = "not_requested") {
  return {
    version: ARI_MEMORY_ACTION_VERSION,
    requested: false,
    memoryOnly: false,
    requestedCount: 0,
    storedCount: 0,
    failedCount: 0,
    status: reason,
    facts: [],
    results: [],
    persistentMemoryAvailable: true,
    source: "ari_vnext_verified_memory_action"
  };
}
