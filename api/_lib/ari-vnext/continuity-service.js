// ARI vNext — low-cost continuity persistence.
// Reuses existing seven-day conversation and durable memory tables.
// No additional model call is required and storage failures never block Ari.

export const CONTINUITY_SERVICE_VERSION = "1.7.0";
const READ_TIMEOUT_MS = 900;
const WRITE_TIMEOUT_MS = 800;
const SECRET_PATTERN = /\b(password|passcode|pin number|cvv|security code|api[_ -]?key|access token|refresh token|private key|secret key|seed phrase|recovery phrase|social security|ssn\b|credit card|card number)\b/i;
const TRANSIENT_PATTERN = /\b(right now|for today|today only|just today|this minute|this second)\b/i;
const SENSITIVE_PATTERN = /\b(diagnos|medication|medicine|pregnan|sexual|bank|debt|income|salary|passport|immigration|legal case)\b/i;

export async function hydrateRecentConversation({ userId, conversationId = null, history = [], limitPairs = 4, force = false } = {}) {
  const safeUserId = clean(userId, 200);
  const safeConversationId = conversationUuid(conversationId);
  const existing = normalizeHistory(history);

  // Server continuity is thread-scoped. Never fall back to "latest turns for this
  // user" when the caller has no valid conversation id because that can blend
  // two intentionally separate conversations together.
  if (!safeUserId || !safeConversationId || (!force && existing.length >= 4)) {
    return { history: existing, hydratedPairs: 0 };
  }

  const config = supabaseConfig();
  if (!config) return { history: existing, hydratedPairs: 0 };

  try {
    const params = new URLSearchParams({
      select: "user_message,assistant_message,created_at",
      user_id: `eq.${safeUserId}`,
      conversation_id: `eq.${safeConversationId}`,
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

export function isConversationRecallRequest(message = "", history = []) {
  const raw = clean(message, 2200);
  if (!raw) return false;

  const explicit = /\b(?:do you remember|did you remember|what (?:do|did) you remember|remember when|what did we|what was (?:that|the)|where were we|we talked about|we discussed|we made|we created|we wrote|previous (?:conversation|chat)|earlier (?:conversation|chat)|old (?:conversation|chat)|another chat|from before|tell me .{0,80}\b(?:we|you)\b .{0,40}\b(?:made|created|wrote|came up with))\b/i.test(raw);
  if (explicit) return true;

  const referential = /^(?:do|did)\s+you\s+remember\s+(?:it|that|this)\b/i.test(raw);
  if (!referential) return false;

  return normalizeHistory(history).some((item) => recallAnchors(item.content).length > 0);
}

export async function searchUserConversationHistory({
  userId,
  message,
  history = [],
  currentConversationId = null,
  privacyControls = null,
  limitMatches = 4
} = {}) {
  const safeUserId = clean(userId, 200);
  const safeCurrentConversationId = conversationUuid(currentConversationId);
  const normalizedHistory = normalizeHistory(history);
  const requested = isConversationRecallRequest(message, normalizedHistory);
  if (!safeUserId || !requested) {
    return { attempted: false, found: false, matchCount: 0, anchors: [], summary: "", source: "user_scoped_conversation_history" };
  }

  const anchors = recallAnchors([message, ...normalizedHistory.slice(-6).map((item) => item.content)].join(" "));
  if (!anchors.length) {
    return { attempted: true, found: false, matchCount: 0, anchors: [], summary: "", reason: "no_recall_anchors", source: "user_scoped_conversation_history" };
  }

  const config = supabaseConfig();
  if (!config) {
    return { attempted: true, found: false, matchCount: 0, anchors, summary: "", reason: "continuity_store_unavailable", source: "user_scoped_conversation_history" };
  }

  try {
    const params = new URLSearchParams({
      select: "conversation_id,user_message,assistant_message,created_at",
      user_id: `eq.${safeUserId}`,
      expires_at: `gt.${new Date().toISOString()}`,
      order: "created_at.desc",
      limit: "120"
    });
    const response = await timedFetch(`${config.url}/rest/v1/ari_conversation_turns?${params.toString()}`, {
      headers: serverHeaders(config.key)
    }, Math.max(READ_TIMEOUT_MS, 1200));
    if (!response.ok) {
      return { attempted: true, found: false, matchCount: 0, anchors, summary: "", reason: `history_read_${response.status}`, source: "user_scoped_conversation_history" };
    }

    const rows = await response.json().catch(() => []);
    const blocked = blockedCategories(privacyControls);
    const scored = (Array.isArray(rows) ? rows : [])
      .filter((row) => !safeCurrentConversationId || conversationUuid(row?.conversation_id) !== safeCurrentConversationId)
      .filter((row) => recallRowAllowed(row, blocked))
      .map((row) => ({ row, score: recallScore(row, anchors) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || Date.parse(b.row?.created_at || 0) - Date.parse(a.row?.created_at || 0))
      .slice(0, Math.max(1, Math.min(6, Number(limitMatches) || 4)));

    if (!scored.length) {
      return { attempted: true, found: false, matchCount: 0, anchors, summary: "", reason: "no_matching_history", source: "user_scoped_conversation_history" };
    }

    const summary = [
      "VERIFIED PRIOR CONVERSATION RECALL",
      "The following snippets came from this signed-in user's retained ARI conversation history. Use them as evidence; do not invent missing parts.",
      ...scored.flatMap(({ row }, index) => {
        const user = clean(row?.user_message, 1400);
        const assistant = clean(row?.assistant_message, 2200);
        const when = clean(row?.created_at, 80);
        return [
          `Match ${index + 1}${when ? ` (${when})` : ""}:`,
          ...(user ? [`User: ${user}`] : []),
          ...(assistant ? [`Ari: ${assistant}`] : [])
        ];
      })
    ].join("\n").slice(0, 9000);

    return {
      attempted: true,
      found: true,
      matchCount: scored.length,
      anchors,
      summary,
      source: "user_scoped_conversation_history"
    };
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI vNext Continuity] Cross-conversation recall failed:", error?.message || error);
    return { attempted: true, found: false, matchCount: 0, anchors, summary: "", reason: error?.name === "AbortError" ? "history_read_timeout" : "history_read_failed", source: "user_scoped_conversation_history" };
  }
}

export async function persistConversationTurn({ userId, turnId = null, conversationId = null, message, reply, surface = "unknown" } = {}) {
  const safeUserId = clean(userId, 200);
  const safeTurnId = clean(turnId, 200) || null;
  const safeConversationId = conversationUuid(conversationId);
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
        turn_id: safeTurnId,
        ...(safeConversationId ? { conversation_id: safeConversationId } : {}),
        user_message: userMessage,
        assistant_message: assistantMessage,
        page_path: clean(surface, 200) || "unknown"
      })
    }, WRITE_TIMEOUT_MS);

    // A replayed network request may race persistence even though the model call
    // itself is deduplicated. The unique user_id + turn_id index makes that
    // harmless; treat duplicate-key persistence as already stored.
    const stored = response.ok || (response.status === 409 && Boolean(safeTurnId));
    if (stored && safeConversationId) {
      await syncChatSession({
        config,
        userId: safeUserId,
        conversationId: safeConversationId,
        message: userMessage,
        reply: assistantMessage
      });
    }
    return Boolean(stored);
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI vNext Continuity] Turn persistence failed:", error?.message || error);
    return false;
  }
}

export function durableMemoryCandidate(message = "", options = {}) {
  const raw = clean(message, 1000);
  if (!raw || raw.length < 4 || SECRET_PATTERN.test(raw)) return null;

  const explicitContent = extractExplicitRemember(raw);
  const explicitRemember = Boolean(explicitContent);
  const outcome = outcomeCandidate(raw, options);
  const preference = preferenceCandidate(raw);
  const goal = goalCandidate(raw);

  if (!explicitRemember && !outcome && !preference && !goal) return null;
  if (raw.includes("?") && !explicitRemember) return null;
  if (TRANSIENT_PATTERN.test(raw) && !explicitRemember && !outcome) return null;
  if (SENSITIVE_PATTERN.test(raw) && !explicitRemember) return null;

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

  if (outcome) {
    return {
      memoryType: "outcome_feedback",
      topic: `${outcome.domain}_outcome`,
      content: outcome.content,
      importance: 6,
      confidence: 0.82,
      tags: ["ari-vnext", "outcome", outcome.direction, outcome.domain, ...outcome.tags]
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

export async function persistDurableMemory({ userId, message, history = [], route = {}, privacyControls = null } = {}) {
  const safeUserId = clean(userId, 200);
  const candidate = durableMemoryCandidate(message, { history, route });
  if (!safeUserId || !candidate?.content) return { stored: false, candidate: null };

  const category = memoryCategoryForCandidate(candidate);
  if (category && blockedCategories(privacyControls).has(category)) {
    return { stored: false, candidate, reason: "privacy_category_blocked", category };
  }

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

async function syncChatSession({ config, userId, conversationId, message, reply } = {}) {
  if (!config || !userId || !conversationId) return false;
  const now = new Date().toISOString();
  const preview = clean(reply || message, 150);

  try {
    // Update only a row that is already owned by this authenticated user. Never
    // use a service-role upsert on client-supplied id alone; that could reassign
    // another user's session if a UUID were guessed or replayed.
    const updateParams = new URLSearchParams({
      id: `eq.${conversationId}`,
      user_id: `eq.${userId}`,
      select: "id"
    });
    const updateResponse = await timedFetch(`${config.url}/rest/v1/ari_chat_sessions?${updateParams.toString()}`, {
      method: "PATCH",
      headers: serverHeaders(config.key, { Prefer: "return=representation" }),
      body: JSON.stringify({
        preview,
        status: "active",
        updated_at: now,
        last_message_at: now
      })
    }, WRITE_TIMEOUT_MS);

    if (updateResponse.ok) {
      const rows = await updateResponse.json().catch(() => []);
      if (Array.isArray(rows) && rows.length > 0) return true;
    }

    // No owned row exists. Insert a new one. A primary-key collision with a row
    // owned by somebody else fails safely instead of changing ownership.
    const insertResponse = await timedFetch(`${config.url}/rest/v1/ari_chat_sessions`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "return=minimal" }),
      body: JSON.stringify({
        id: conversationId,
        user_id: userId,
        title: conversationTitle(message),
        preview,
        status: "active",
        updated_at: now,
        last_message_at: now
      })
    }, WRITE_TIMEOUT_MS);
    return insertResponse.ok;
  } catch (error) {
    if (error?.name !== "AbortError") console.warn("[ARI vNext Continuity] Chat session sync failed:", error?.message || error);
    return false;
  }
}

function conversationTitle(message = "") {
  const words = clean(message, 300).replace(/[\n\r]+/g, " ").split(/\s+/).filter(Boolean).slice(0, 7);
  const joined = words.join(" ") || "Conversation";
  return joined.length > 52 ? `${joined.slice(0, 49).trim()}…` : joined;
}

function conversationUuid(value = "") {
  const id = clean(value, 200).toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id) ? id : null;
}

export function memoryCategoryForCandidate(candidate = {}) {
  const type = clean(candidate?.memoryType, 80);
  if (type === "preference") return "preferences";
  if (type === "goal") return "goals";
  if (type === "outcome_feedback") return "fitness_outcomes";
  if (type !== "explicit_memory") return null;

  const text = clean(candidate?.content, 1200).toLowerCase();
  if (/\b(prefer|favorite|favourite|like|dislike|hate|love)\b/.test(text)) return "preferences";
  if (/\b(goal|target|trying to|want to lose|want to gain|want to maintain|cutting|bulking)\b/.test(text)) return "goals";
  if (/\b(can't|cannot|schedule|shift|budget|equipment|allerg|injur|pain|access)\b/.test(text)) return "constraints";
  if (/\b(wife|husband|spouse|brother|sister|friend|partner|relationship)\b/.test(text)) return "relationship";
  if (/\b(worked|helped|worse|improved|declined|performance|recovery|strength)\b/.test(text)) return "fitness_outcomes";
  if (/\b(i am|i'm|my name|my age|i work|my job|occupation)\b/.test(text)) return "identity";
  return null;
}

function outcomeCandidate(text, { history = [], route = {} } = {}) {
  const positive = /\b(that|it|this|your (?:plan|advice|change|recommendation))\s+(?:really\s+)?(?:worked|helped|is working|has worked)|\b(?:i['’]?m|i am)\s+(?:getting|feeling)\s+(?:stronger|better)|\b(?:strength|recovery|energy|performance)\s+(?:improved|is better|got better)\b/i.test(text);
  const negative = /\b(that|it|this|your (?:plan|advice|change|recommendation))\s+(?:didn['’]?t|did not|isn['’]?t|is not)\s+work|\bmade\s+(?:it|things|me)\s+worse|\b(?:i['’]?m|i am)\s+(?:getting|feeling)\s+(?:weaker|worse)|\b(?:strength|recovery|energy|performance)\s+(?:declined|is worse|got worse)\b/i.test(text);
  if (!positive && !negative) return null;

  const domain = outcomeDomain(route, history);
  if (!domain) return null;

  const previousAssistant = [...(Array.isArray(history) ? history : [])]
    .reverse()
    .find((item) => item?.role === "assistant" && clean(item?.content, 600));
  const guidance = compactGuidance(previousAssistant?.content || "");
  const direction = negative && !positive ? "negative" : positive && !negative ? "positive" : "mixed";
  const report = stripTrailing(text);
  const content = [
    `User reported a ${direction} outcome after recent ${domain} guidance: ${report}.`,
    guidance ? `Recent Ari guidance context: ${guidance}.` : ""
  ].filter(Boolean).join(" ").slice(0, 1100);

  return {
    direction,
    domain,
    content,
    tags: keywords(`${report} ${guidance}`)
  };
}

function outcomeDomain(route = {}, history = []) {
  if (route?.training) return "training";
  if (route?.nutrition) return "nutrition";
  if (route?.goals) return "goals";

  const recent = (Array.isArray(history) ? history : [])
    .slice(-4)
    .map((item) => clean(item?.content, 500))
    .join(" ");
  if (/\b(workout|training|exercise|sets?|reps?|strength|program|deload|recovery)\b/i.test(recent)) return "training";
  if (/\b(calorie|protein|carb|fat|meal|nutrition|diet|food)\b/i.test(recent)) return "nutrition";
  if (/\b(goal|weight|target|cut|bulk|lose|gain|maintain)\b/i.test(recent)) return "goals";
  return null;
}

function compactGuidance(value) {
  return clean(value, 420)
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/g, "")
    .trim();
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

function blockedCategories(privacyControls) {
  const list = Array.isArray(privacyControls?.blockedCategories) ? privacyControls.blockedCategories : [];
  return new Set(list.map((item) => clean(item, 80).toLowerCase()).filter(Boolean));
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

function recallAnchors(value = "") {
  const stop = new Set([
    "about", "again", "another", "before", "chat", "conversation", "created", "did", "earlier", "from", "have", "made",
    "remember", "said", "story", "tell", "that", "the", "this", "what", "when", "where", "with", "wrote", "you", "your", "we",
    "our", "was", "were", "are", "and", "but", "for", "not", "can", "could", "would", "should", "please", "it"
  ]);
  return [...new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .filter((item) => item.length >= 3 && !stop.has(item))
  )].slice(0, 10);
}

function recallScore(row = {}, anchors = []) {
  const text = `${clean(row?.user_message, 3000)} ${clean(row?.assistant_message, 5000)}`.toLowerCase();
  if (!text) return 0;
  let score = 0;
  for (const anchor of anchors) {
    if (!anchor) continue;
    if (text.includes(anchor)) score += anchor.length >= 7 ? 3 : anchor.length >= 5 ? 2 : 1;
  }
  return score;
}

function recallRowAllowed(row = {}, blocked = new Set()) {
  if (!blocked?.size) return true;
  const text = `${clean(row?.user_message, 3000)} ${clean(row?.assistant_message, 5000)}`.toLowerCase();
  const patterns = {
    identity: /\b(name|age|birthday|job|occupation|work as|i am|i'm)\b/i,
    preferences: /\b(prefer|favorite|favourite|like|dislike|hate|love)\b/i,
    goals: /\b(goal|target|trying to|want to lose|want to gain|want to maintain|cutting|bulking)\b/i,
    constraints: /\b(can't|cannot|schedule|shift|budget|equipment|allerg|injur|pain|access)\b/i,
    relationship: /\b(wife|husband|spouse|brother|sister|friend|partner|relationship)\b/i,
    fitness_outcomes: /\b(workout|training|strength|recovery|performance|weight|nutrition|calorie)\b/i
  };
  for (const category of blocked) {
    const pattern = patterns[category];
    if (pattern?.test(text)) return false;
  }
  return true;
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
