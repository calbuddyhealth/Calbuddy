// ARI vNext — targeted long-term memory retrieval.
// Retrieves only user-owned memories and ranks them for the current turn.

export const MEMORY_SERVICE_VERSION = "1.2.0";

export async function retrieveRelevantMemories({ userId, message, limit = 6 } = {}) {
  const id = String(userId || "").trim();
  const query = String(message || "").trim();
  if (!id || !query) return { memories: [], summary: "" };

  const supabaseUrl = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!supabaseUrl || !serviceKey) return { memories: [], summary: "" };

  try {
    const url = new URL(`${supabaseUrl}/rest/v1/ari_user_memory`);
    url.searchParams.set("user_id", `eq.${id}`);
    url.searchParams.set("select", "id,memory_type,topic,content,importance,confidence,tags,updated_at");
    url.searchParams.set("order", "updated_at.desc");
    url.searchParams.set("limit", "60");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      console.warn("[ARI vNext Memory] Retrieval unavailable:", response.status);
      return { memories: [], summary: "" };
    }

    const rows = await response.json().catch(() => []);
    const memories = rankMemories(Array.isArray(rows) ? rows : [], query).slice(0, Math.max(1, Math.min(10, Number(limit) || 6)));

    return {
      memories,
      summary: memories.map((item) => `- ${item.content}`).join("\n").slice(0, 5000)
    };
  } catch (error) {
    console.warn("[ARI vNext Memory] Retrieval failed:", error?.message || error);
    return { memories: [], summary: "" };
  }
}

export function rankMemories(memories = [], message = "") {
  const queryTokens = tokenize(message);
  const now = Date.now();
  const requestedDomain = inferCoachingDomain(message);

  return memories
    .map((memory) => {
      const content = String(memory?.content || "").trim();
      const memoryType = String(memory?.memory_type || "general");
      const topic = String(memory?.topic || "general");
      const haystack = `${topic} ${content} ${(memory?.tags || []).join(" ")}`;
      const memoryTokens = tokenize(haystack);
      const overlap = [...queryTokens].filter((token) => memoryTokens.has(token)).length;
      const overlapScore = queryTokens.size ? overlap / queryTokens.size : 0;
      const importance = normalizedImportance(memory?.importance);
      const confidence = clamp(Number(memory?.confidence ?? 0.75), 0, 1);
      const updatedAt = Date.parse(memory?.updated_at || "") || 0;
      const ageDays = updatedAt ? Math.max(0, (now - updatedAt) / 86400000) : 3650;
      const recency = Math.exp(-ageDays / 180);
      const explicitRecallBoost = /\b(remember|last time|before|again|what did i|what was|you know|prefer|favorite|favourite|dislike)\b/i.test(message) ? 0.12 : 0;
      const outcomeBoost = outcomeMemoryBoost({ memoryType, topic, content, requestedDomain });

      const score = overlapScore * 0.55 + importance * 0.2 + confidence * 0.15 + recency * 0.1 + explicitRecallBoost + outcomeBoost;

      return {
        id: memory?.id || null,
        memoryType,
        topic,
        content,
        importance: Number(memory?.importance ?? 5),
        confidence: Number(memory?.confidence ?? 0.75),
        updatedAt: memory?.updated_at || null,
        relevanceScore: Number(score.toFixed(4))
      };
    })
    .filter((item) => item.content && (item.relevanceScore >= 0.18 || /\b(remember|last time|before|again|what did i|what was|you know|prefer|favorite|favourite|dislike)\b/i.test(message)))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function outcomeMemoryBoost({ memoryType, topic, content, requestedDomain }) {
  if (!requestedDomain) return 0;
  if (memoryType !== "outcome_feedback" && !/\b(outcome|worked|helped|worse|improved|declined)\b/i.test(content)) return 0;

  const text = `${topic} ${content}`.toLowerCase();
  if (requestedDomain === "training" && /\b(training|workout|strength|recovery|program|lift|exercise)\b/.test(text)) return 0.13;
  if (requestedDomain === "nutrition" && /\b(nutrition|calorie|protein|food|meal|diet|intake)\b/.test(text)) return 0.13;
  if (requestedDomain === "goals" && /\b(goal|weight|cut|bulk|lose|gain|maintain)\b/.test(text)) return 0.12;
  return 0.05;
}

function inferCoachingDomain(message = "") {
  const text = String(message || "").toLowerCase();
  if (/\b(workout|training|exercise|lift|strength|program|plateau|recovery|sets?|reps?)\b/.test(text)) return "training";
  if (/\b(nutrition|calorie|protein|carb|fat|meal|food|diet|intake)\b/.test(text)) return "nutrition";
  if (/\b(goal|weight|cut|bulk|lose|gain|maintain|target|pace)\b/.test(text)) return "goals";
  return null;
}

function normalizedImportance(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  // ARI XP has had both 0–1 and 1–10 importance conventions over time.
  // Normalize either representation without rewriting historical rows.
  return number <= 1 ? clamp(number, 0, 1) : clamp(number / 10, 0, 1);
}

function tokenize(value = "") {
  const stop = new Set(["the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "is", "it", "this", "that", "my", "i", "me", "you"]);
  return new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !stop.has(token))
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
