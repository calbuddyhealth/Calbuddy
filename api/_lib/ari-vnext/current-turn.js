// ARI vNext — current-turn normalization and action isolation.

export const CURRENT_TURN_VERSION = "1.0.0";

export function buildCurrentTurn(body = {}, userId = null) {
  const message = cleanText(body?.message, 8000);
  const history = normalizeHistory(body?.history);
  const context = normalizeObject(body?.context);
  const preferences = normalizeObject(body?.preferences || context?.preferences);
  const memory = cleanText(body?.memorySummary || body?.coachMemorySummary, 5000);
  const surface = cleanText(body?.surface || context?.surface || context?.page, 120) || "unknown";

  return {
    version: CURRENT_TURN_VERSION,
    userId: cleanText(userId, 200) || null,
    turnId: cleanText(body?.turnId, 200) || makeId("turn"),
    message,
    history,
    context,
    preferences,
    memory,
    surface,
    pendingAction: normalizePendingAction(body?.pendingAction),
    createdAt: new Date().toISOString()
  };
}

export function normalizeHistory(history = []) {
  if (!Array.isArray(history)) return [];

  const output = [];
  let characters = 0;

  for (const item of history.slice(-16)) {
    const role = item?.role === "assistant" ? "assistant" : "user";
    const content = cleanText(item?.content, 2200);
    if (!content) continue;

    characters += content.length;
    if (characters > 14000) break;
    output.push({ role, content });
  }

  return output;
}

export function normalizePendingAction(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (value?.status && value.status !== "pending_confirmation") return null;

  const id = cleanText(value?.id, 200);
  const name = cleanText(value?.name, 120);
  const sourceTurnId = cleanText(value?.sourceTurnId, 200);
  const expiresAt = cleanText(value?.expiresAt, 80);

  if (!id || !name || !sourceTurnId) return null;
  if (expiresAt && Date.parse(expiresAt) < Date.now()) return null;

  return {
    id,
    name,
    sourceTurnId,
    arguments: normalizeObject(value?.arguments),
    status: "pending_confirmation",
    expiresAt: expiresAt || null
  };
}

export function normalizeObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return {};
  }
}

export function cleanText(value, maxLength = 1000) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function makeId(prefix = "ari") {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
