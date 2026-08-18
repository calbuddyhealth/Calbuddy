// ARI vNext — low-cost continuity persistence.
// Reuses existing seven-day conversation and durable memory tables.
// No additional model call is required and storage failures never block Ari.

export const CONTINUITY_SERVICE_VERSION = "1.2.0";
const READ_TIMEOUT_MS = 900;
const WRITE_TIMEOUT_MS = 800;
const SECRET_PATTERN = /\b(password|passcode|pin number|cvv|security code|api[_ -]?key|access token|refresh token|private key|secret key|seed phrase|recovery phrase|social security|ssn\b|credit card|card number)\b/i;
const TRANSIENT_PATTERN = /\b(right now|for today|today only|just today|this minute|this second)\b/i;

export async function hydrateRecentConversation({ userId, history = [], limitPairs = 4 } = {}) {
  const safeUserId = clean(userId, 200);
  const existing = normalizeHistory(history);
  if (!safeUserId || existing.length >= 4) return { history: existing, hydratedPairs: 0 };

  const config = supabaseConfig();
  if (!config) return { history: existing, hydratedPairs: 0 };

  try {
    const params = new URLSearchParams({
      select: "user_message,assistant_message,created_at",
      user_id: `eq.${safeUserId}`,
      expires_at: `gt.${new Date().toISOString()}`,
      order: "created_at.desc",
      limit: String(Math.max(1, Math.min(6, Number(limitPairs) || 4)))
    });

    const response = await timedFetch(`${config.url}/rest/v1/ari_conversation_turns?${params.toString()}`, {
      headers: serverHeaders(config.key)
    }, READ_TIMEOUT_MS);
    if (!response.ok) return { history: existing, hydratedPairs: 0 };

    const rows = await response.json().catch(() => []);
    const serverHistory = (Array.isArray(rows) ? rows : [])
      .slice()
      .reverse()
      .flatMap((row) => {
        const user = clean(row?.user_message, 1200);
        const assistant = clean(row?.assistant_message, 1800);
        return [
          ...(user ? [{ role: "user", content: user }] : []),
          ...(assistant ? [{ role: "assistant", content: assistant }] : [])
        ];
      });

    const merged = mergeHistory(serverHistory, existing).slice(-12);
    return { history: merged, hydratedPairs: Math.floor(serverHistory.length / 2) };
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI vNext Continuity] Recent conversation hydration failed:", error?.message || error);
    return { history: existing, hydratedPairs: 0 };
  }
}

export async function persistConversationTurn({ userId, message, reply, surface = "unknown" } = {}) {
  const safeUserId = clean(userId, 200);
  const userMessage = clean(message, 8000);
  const assistantMessage = clean(reply, 12000);
  if (!safeUserId || !userMessage || !assistantMessage) return false;

  const config = supabaseConfig();
  if (!config) return false;

  try {
    const response = await timedFetch(`${config.url}/rest/v1/ari_conversation_turns`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        user_id: safeUserId,
        user_message: userMessage,
        assistant_message: assistantMessage,
        page_path: clean(surface, 200) || "unknown"
      })
    }, WRITE_TIMEOUT_MS);
    return response.ok;
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI vNext Continuity] Turn persistence failed:", error?.message || error);
    return false;
  }
}

export function durableMemoryCandidate(message = "") {
  const raw = clean(message, 1000);
  if (!raw || raw.length < 4 || SECRET_PATTERN.test(raw)) return null;

  const explicitContent = extractExplicitRemember(raw);
  const explicitRemember = Boolean(explicitContent);
  const preference = preferenceCandidate(raw);
  const goal = goalCandidate(raw);

  if (!explicitRemember && !preference && !goal) return null;
  if (raw.includes("?") && !explicitRemember) return null;
  if (TRANSIENT_PATTERN.test(raw) && !explicitRemember) return null;

  const sensitive = /\b(diagnos|medication|medicine|pregnan|sexual|bank|debt|income|salary|passport|immigration|legal case)\b/i.test(raw);
  if (sensitive && !explicitRemember) return null;

  if (explicitRemember) {
    return {
      memoryType: "explicit_memory",
      topic: "user_requested_memory",
      content: explicitContent,
      importance: 9,
      confidence: 0.98,
      tags: ["ari-vnext", "explicit_memory", ...keywords(explicitContent)]
    };
  }

  if (preference) {
    return {
      memoryType: "preference",
      topic: preference.topic,
      content: preference.content,
      importance: 7,
      confidence: 0.94,
      tags: ["ari-vnext", "preference", ...preference.tags]
    };
  }

  return {
    memoryType: "goal",
    topic: "goal",
    content: goal.content,
    importance: 8,
    confidence: 0.92,
    tags: ["ari-vnext", "goal", ...goal.tags]
  };
}

export async function persistDurableMemory({ userId, message } = {}) {
  const safeUserId = clean(userId, 200);
  const candidate = durableMemoryCandidate(message);
  if (!safeUserId || !candidate?.content) return { stored: false, candidate: null };

  const config = supabaseConfig();
  if (!config) return { stored: false, candidate };

  try {
    const params = new URLSearchParams({ on_conflict: "user_id,content" });
    const now = new Date().toISOString();
    const response = await timedFetch(`${config.url}/rest/v1/ari_user_memory?${params.toString()}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify({
        user_id: safeUserId,
        memory_type: candidate.memoryType,
        topic: candidate.topic,
        content: candidate.content,
        importance: candidate.importance,
        confidence: candidate.confidence,
        tags: candidate.tags,
        type: candidate.memoryType,
        domain: candidate.topic,
        claim: candidate.content,
        keywords: candidate.tags,
        source: "ari-vnext",
        memory_status: "active",
        last_confirmed_at: now,
        updated_at: now
      })
    }, WRITE_TIMEOUT_MS);

    return { stored: response.ok, candidate };
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI vNext Continuity] Durable memory persistence failed:", error?.message || error);
    return { stored: false, candidate };
  }
}

function extractExplicitRemember(text) {
  const patterns = [
    /\bremember(?: that)?\s+(.+)/i,
    /\bdon['’]?t forget(?: that)?\s+(.+)/i,
    /\bdo not forget(?: that)?\s+(.+)/i,
    /\bkeep in mind(?: that)?\s+(.+)/i
  ];
  for (const pattern of patterns) {
    const value = clean(text.match(pattern)?.[1], 800);
    if (value) return stripTrailing(value);
  }
  return "";
}

function preferenceCandidate(text) {
  const rules = [
    { pattern: /\bi want ari to\s+(.+)/i, verb: "User prefers Ari to", topic: "ari_interaction_preference" },
    { pattern: /\bi prefer ari to\s+(.+)/i, verb: "User prefers Ari to", topic: "ari_interaction_preference" },
    { pattern: /\bi (?:really )?prefer\s+(.+)/i, verb: "User prefers", topic: "preference" },
    { pattern: /\bmy favou?rite(?:\s+[^ ]+)? is\s+(.+)/i, verb: "User's favorite is", topic: "preference" },
    { pattern: /\bi (?:really )?(?:like|love)\s+(.+)/i, verb: "User likes", topic: "preference" },
    { pattern: /\bi (?:really )?(?:hate|dislike|don['’]?t like|do not like)\s+(.+)/i, verb: "User dislikes", topic: "preference" }
  ];

  for (const rule of rules) {
    const value = clean(text.match(rule.pattern)?.[1], 620);
    if (!value) continue;
    const normalized = stripTrailing(value);
    return {
      topic: rule.topic,
      content: `${rule.verb} ${normalized}.`,
      tags: keywords(normalized)
    };
  }
  return null;
}

function goalCandidate(text) {
  const rules = [
    /\bmy (?:main )?(?:goal|target) is\s+(.+)/i,
    /\bi['’]?(?:m| am) trying to\s+(.+)/i,
    /\bi want to\s+((?:lose|gain|maintain|run|train|lift|build|improve|reach)\b.+)/i
  ];

  for (const rule of rules) {
    const value = clean(text.match(rule)?.[1], 620);
    if (!value) continue;
    const normalized = stripTrailing(value).replace(/^to\s+/i, "");
    return {
      content: `User's stated goal is to ${normalized}.`,
      tags: keywords(normalized)
    };
  }
  return null;
}

async function timedFetch(url, options = {}, timeoutMs = 1000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.max(100, Number(timeoutMs) || 1000));
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 6000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra
  };
}

function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history
    .map((item) => ({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: clean(item?.content, 2200)
    }))
    .filter((item) => item.content)
    .slice(-16);
}

function mergeHistory(serverHistory = [], existing = []) {
  const combined = [...serverHistory, ...existing];
  const output = [];

  for (const item of combined) {
    const previous = output[output.length - 1];
    if (previous && previous.role === item.role && previous.content === item.content) continue;
    output.push(item);
  }
  return output;
}

function keywords(value) {
  const stop = new Set(["the", "and", "that", "this", "with", "from", "have", "want", "really", "more", "less", "into", "about", "your", "ari"]);
  return [...new Set(String(value || "").toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter((item) => item.length >= 3 && !stop.has(item)))].slice(0, 8);
}

function stripTrailing(value) {
  return String(value || "").trim().replace(/[.!?]+$/g, "").trim();
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
