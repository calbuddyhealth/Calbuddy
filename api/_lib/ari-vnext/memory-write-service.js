// ARI vNext — selective durable memory capture.
// Uses deterministic extraction so memory continuity does not require another model call.
// Stores only explicit/stable user facts or preferences; never stores every conversation.

export const MEMORY_WRITE_VERSION = "1.0.0";

const SECRET_PATTERN = /\b(password|passcode|pin\b|api[_ -]?key|secret\b|access[_ -]?token|refresh[_ -]?token|private[_ -]?key|seed phrase|recovery phrase|social security|ssn\b|credit card|card number|cvv\b)\b/i;
const TRANSIENT_PATTERN = /\b(right now|for today|today only|just today|this minute|this second)\b/i;

export function deriveDurableMemoryCandidate({ message = "" } = {}) {
  const raw = clean(message, 700);
  if (!raw || raw.length < 4 || SECRET_PATTERN.test(raw)) return null;

  const explicit = matchExplicitRemember(raw);
  if (explicit) return candidate("explicit", "user_requested_memory", explicit, 9, 0.98, ["explicit", "remember"]);

  const preference = matchPreference(raw);
  if (preference) return candidate("preference", preference.topic, preference.content, 8, 0.94, ["preference", ...preference.tags]);

  const goal = matchStableGoal(raw);
  if (goal && !TRANSIENT_PATTERN.test(raw)) return candidate("goal", goal.topic, goal.content, 8, 0.9, ["goal", ...goal.tags]);

  return null;
}

export async function persistDurableMemory({ userId, candidate: memory } = {}) {
  const id = clean(userId, 200);
  if (!id || !memory?.content) return { saved: false, reason: "missing_memory_identity" };

  const supabaseUrl = clean(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  const serviceKey = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 5000);
  if (!supabaseUrl || !serviceKey) return { saved: false, reason: "memory_store_unavailable" };

  const content = clean(memory.content, 700);
  if (!content || SECRET_PATTERN.test(content)) return { saved: false, reason: "memory_rejected" };

  try {
    const existingUrl = new URL(`${supabaseUrl}/rest/v1/ari_user_memory`);
    existingUrl.searchParams.set("user_id", `eq.${id}`);
    existingUrl.searchParams.set("content", `eq.${content}`);
    existingUrl.searchParams.set("select", "id");
    existingUrl.searchParams.set("limit", "1");

    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    };

    const existingResponse = await fetch(existingUrl.toString(), { method: "GET", headers });
    if (existingResponse.ok) {
      const existingRows = await existingResponse.json().catch(() => []);
      const existingId = Array.isArray(existingRows) ? existingRows[0]?.id : null;
      if (existingId) {
        const patchUrl = new URL(`${supabaseUrl}/rest/v1/ari_user_memory`);
        patchUrl.searchParams.set("id", `eq.${existingId}`);
        const patched = await fetch(patchUrl.toString(), {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify({
            importance: memory.importance,
            confidence: memory.confidence,
            tags: memory.tags,
            updated_at: new Date().toISOString(),
            last_confirmed_at: new Date().toISOString(),
            memory_status: "active"
          })
        });
        return { saved: patched.ok, refreshed: patched.ok, id: existingId, reason: patched.ok ? null : `refresh_${patched.status}` };
      }
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/ari_user_memory`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: id,
        memory_type: memory.memoryType,
        topic: memory.topic,
        content,
        importance: memory.importance,
        confidence: memory.confidence,
        tags: memory.tags,
        type: memory.memoryType,
        domain: memory.topic,
        claim: content,
        keywords: memory.tags,
        source: "ari-vnext-selective-memory",
        memory_status: "active",
        last_confirmed_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.warn("[ARI vNext Memory] Durable write unavailable:", response.status);
      return { saved: false, reason: `insert_${response.status}` };
    }

    const rows = await response.json().catch(() => []);
    return { saved: true, refreshed: false, id: Array.isArray(rows) ? rows[0]?.id || null : null, reason: null };
  } catch (error) {
    console.warn("[ARI vNext Memory] Durable write failed:", error?.message || error);
    return { saved: false, reason: "write_failed" };
  }
}

function matchExplicitRemember(text) {
  const patterns = [
    /\bremember(?: that)?\s+(.+)/i,
    /\bdon['’]?t forget(?: that)?\s+(.+)/i,
    /\bkeep in mind(?: that)?\s+(.+)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = clean(match?.[1], 620);
    if (value) return `User explicitly asked Ari to remember: ${stripTrailing(value)}.`;
  }
  return null;
}

function matchPreference(text) {
  const rules = [
    { pattern: /\bi (?:really )?prefer\s+(.+)/i, verb: "prefers", topic: "preference" },
    { pattern: /\bi (?:really )?like\s+(.+)/i, verb: "likes", topic: "preference" },
    { pattern: /\bi (?:really )?love\s+(.+)/i, verb: "likes", topic: "preference" },
    { pattern: /\bi (?:really )?(?:hate|dislike|don['’]?t like|do not like)\s+(.+)/i, verb: "dislikes", topic: "preference" },
    { pattern: /\bi want ari to\s+(.+)/i, verb: "prefers Ari to", topic: "ari_interaction_preference" },
    { pattern: /\bi prefer ari to\s+(.+)/i, verb: "prefers Ari to", topic: "ari_interaction_preference" }
  ];

  for (const rule of rules) {
    const match = text.match(rule.pattern);
    const value = clean(match?.[1], 520);
    if (!value) continue;
    const normalized = stripTrailing(value);
    return {
      topic: rule.topic,
      content: `User ${rule.verb} ${normalized}.`,
      tags: keywords(normalized)
    };
  }
  return null;
}

function matchStableGoal(text) {
  const rules = [
    { pattern: /\bmy (?:main )?(?:goal|target) is\s+(.+)/i, topic: "goal" },
    { pattern: /\bi(?:'m| am) trying to\s+(.+)/i, topic: "goal" },
    { pattern: /\bi want to\s+(lose|gain|maintain|run|train|lift|build|improve|reach)\b(.+)/i, topic: "goal", combine: true }
  ];

  for (const rule of rules) {
    const match = text.match(rule.pattern);
    const value = rule.combine ? clean(`${match?.[1] || ""}${match?.[2] || ""}`, 520) : clean(match?.[1], 520);
    if (!value) continue;
    const normalized = stripTrailing(value);
    return {
      topic: rule.topic,
      content: `User's stated goal is to ${normalizeGoalPhrase(normalized)}.`,
      tags: keywords(normalized)
    };
  }
  return null;
}

function normalizeGoalPhrase(value) {
  const text = String(value || "").trim();
  return /^(?:lose|gain|maintain|run|train|lift|build|improve|reach)\b/i.test(text) ? text : text.replace(/^to\s+/i, "");
}

function candidate(memoryType, topic, content, importance, confidence, tags = []) {
  return {
    version: MEMORY_WRITE_VERSION,
    memoryType,
    topic,
    content: clean(content, 700),
    importance,
    confidence,
    tags: [...new Set(tags.map((item) => clean(item, 80).toLowerCase()).filter(Boolean))].slice(0, 12)
  };
}

function keywords(value) {
  const stop = new Set(["the", "and", "that", "this", "with", "from", "have", "want", "really", "more", "less", "into", "about", "your", "ari"]);
  return [...new Set(String(value || "").toLowerCase().replace(/[^a-z0-9\s'-]/g, " ").split(/\s+/).filter((item) => item.length >= 3 && !stop.has(item)))].slice(0, 8);
}

function stripTrailing(value) {
  return String(value || "").trim().replace(/[.!?]+$/g, "").trim();
}

function clean(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}
