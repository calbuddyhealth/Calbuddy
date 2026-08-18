// ARI vNext — low-cost continuity persistence.
// Reuses existing seven-day conversation and durable memory tables.
// No additional model call is required and storage failures never block Ari.

export const CONTINUITY_SERVICE_VERSION = "1.1.0";
const READ_TIMEOUT_MS = 900;
const WRITE_TIMEOUT_MS = 800;

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
  if (!raw || raw.length < 4) return null;

  const lower = raw.toLowerCase();
  const explicitRemember = /\b(remember(?: that)?|don't forget(?: that)?|do not forget(?: that)?)\b/i.test(raw);
  const preference = /\b(i prefer|i like|i love|i hate|i dislike|i don['’]?t like|my favorite|my favourite)\b/i.test(raw);
  const goal = /\b(my goal is|my target is|i want to (?:lose|gain|maintain)|i['’]?m trying to (?:cut|bulk|lose|gain)|i am trying to (?:cut|bulk|lose|gain))\b/i.test(raw);
  const correction = /\b(actually|correction|from now on|going forward)\b/i.test(raw) && /\b(my|i|me)\b/i.test(raw);

  if (!explicitRemember && !preference && !goal && !correction) return null;
  if (raw.includes("?") && !explicitRemember) return null;
  if (containsSecretLikeMaterial(lower)) return null;

  const sensitive = /\b(diagnos|medication|medicine|pregnan|sexual|bank|credit card|debt|income|salary|ssn|social security|passport|immigration|legal case)\b/i.test(lower);
  if (sensitive && !explicitRemember) return null;

  const type = explicitRemember
    ? "explicit_memory"
    : correction
      ? "correction"
      : goal
        ? "goal"
        : "preference";

  const content = explicitRemember
    ? raw.replace(/^\s*(?:please\s+)?(?:remember|don['’]?t forget|do not forget)(?:\s+that)?\s*/i, "").trim() || raw
    : raw;

  return {
    memoryType: type,
    topic: type === "explicit_memory" ? "user_requested_memory" : type,
    content: clean(content, 800),
    importance: explicitRemember || goal || correction ? 8 : 6,
    confidence: explicitRemember ? 0.98 : correction ? 0.94 : 0.9,
    tags: ["ari-vnext", type]
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
        source: "ari-vnext"
      })
    }, WRITE_TIMEOUT_MS);

    return { stored: response.ok, candidate };
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI vNext Continuity] Durable memory persistence failed:", error?.message || error);
    return { stored: false, candidate };
  }
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

function containsSecretLikeMaterial(lower = "") {
  return /\b(password|passcode|pin number|cvv|security code|api[_ -]?key|access token|refresh token|private key|secret key|seed phrase|recovery phrase)\b/i.test(lower);
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
