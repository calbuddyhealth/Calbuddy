// ARI vNext — short-lived encrypted OpenAI reasoning continuity.
// Carries only provider response-thread metadata between browser turns.
// No hidden chain-of-thought is exposed to the client.

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual
} from "node:crypto";

export const ARI_REASONING_CONTINUITY_VERSION = "1.0.0";

const TOKEN_PREFIX = "arc1";
const DEFAULT_TTL_MINUTES = 120;
const MAX_TTL_MINUTES = 1440;

export function sealReasoningContinuityToken({
  userId = "",
  conversationId = "",
  responseId = "",
  model = "",
  baselineEffort = "",
  effectiveEffort = "",
  reasoningMode = "standard",
  reasoningContext = "all_turns"
} = {}) {
  const uid = clean(userId, 240);
  const cid = clean(conversationId, 240);
  const rid = clean(responseId, 240);
  const selectedModel = clean(model, 160);
  const secret = continuitySecret();

  if (!secret || !uid || !cid || !rid || !selectedModel) return null;

  const now = Date.now();
  const ttlMs = boundedInt(
    process.env.ARI_REASONING_CONTINUITY_TTL_MINUTES,
    DEFAULT_TTL_MINUTES,
    10,
    MAX_TTL_MINUTES
  ) * 60_000;

  const payload = {
    v: ARI_REASONING_CONTINUITY_VERSION,
    uid,
    cid,
    rid,
    model: selectedModel,
    baselineEffort: normalizeEffort(baselineEffort),
    effectiveEffort: normalizeEffort(effectiveEffort || baselineEffort),
    reasoningMode: normalizeMode(reasoningMode),
    reasoningContext: normalizeContext(reasoningContext),
    iat: now,
    exp: now + ttlMs
  };

  try {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", continuityKey(secret), iv);
    cipher.setAAD(Buffer.from(TOKEN_PREFIX, "utf8"));
    const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      TOKEN_PREFIX,
      iv.toString("base64url"),
      encrypted.toString("base64url"),
      tag.toString("base64url")
    ].join(".");
  } catch {
    return null;
  }
}

export function openReasoningContinuityToken({
  token = "",
  userId = "",
  conversationId = "",
  now = Date.now()
} = {}) {
  const value = clean(token, 5000);
  const uid = clean(userId, 240);
  const cid = clean(conversationId, 240);
  const secret = continuitySecret();

  if (!value) return invalid("missing");
  if (!secret) return invalid("secret_unavailable");
  if (!uid || !cid) return invalid("identity_missing");

  const parts = value.split(".");
  if (parts.length !== 4 || parts[0] !== TOKEN_PREFIX) return invalid("format");

  try {
    const iv = Buffer.from(parts[1], "base64url");
    const encrypted = Buffer.from(parts[2], "base64url");
    const tag = Buffer.from(parts[3], "base64url");
    if (iv.length !== 12 || tag.length !== 16 || encrypted.length < 8) return invalid("format");

    const decipher = createDecipheriv("aes-256-gcm", continuityKey(secret), iv);
    decipher.setAAD(Buffer.from(TOKEN_PREFIX, "utf8"));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const parsed = JSON.parse(plaintext.toString("utf8"));

    if (clean(parsed?.v, 40) !== ARI_REASONING_CONTINUITY_VERSION) return invalid("version");
    if (!constantTimeTextEqual(clean(parsed?.uid, 240), uid)) return invalid("user_mismatch");
    if (!constantTimeTextEqual(clean(parsed?.cid, 240), cid)) return invalid("conversation_mismatch");

    const exp = Number(parsed?.exp || 0);
    if (!Number.isFinite(exp) || exp <= Number(now || Date.now())) return invalid("expired");

    const responseId = clean(parsed?.rid, 240);
    const model = clean(parsed?.model, 160);
    if (!responseId || !model) return invalid("payload");

    return {
      valid: true,
      reason: "verified",
      state: {
        version: ARI_REASONING_CONTINUITY_VERSION,
        previousResponseId: responseId,
        model,
        baselineEffort: normalizeEffort(parsed?.baselineEffort),
        effectiveEffort: normalizeEffort(parsed?.effectiveEffort || parsed?.baselineEffort),
        reasoningMode: normalizeMode(parsed?.reasoningMode),
        reasoningContext: normalizeContext(parsed?.reasoningContext),
        expiresAt: new Date(exp).toISOString()
      }
    };
  } catch {
    return invalid("decrypt_failed");
  }
}

export function publicReasoningContinuity({
  token = null,
  resumed = false,
  policy = null,
  provider = null
} = {}) {
  return {
    version: ARI_REASONING_CONTINUITY_VERSION,
    active: Boolean(token),
    resumed: resumed === true,
    token: token || null,
    model: clean(provider?.model || policy?.model, 160) || null,
    reasoningMode: normalizeMode(policy?.reasoningMode),
    reasoningContext: normalizeContext(policy?.reasoningContext),
    effectiveEffort: normalizeEffort(policy?.reasoningEffort),
    hiddenReasoningExposed: false
  };
}

function continuitySecret() {
  return clean(
    process.env.ARI_REASONING_CONTINUITY_SECRET ||
    process.env.ARI_PROVIDER_API_KEY ||
    process.env.OPENAI_API_KEY,
    10000
  );
}

function continuityKey(secret) {
  return createHash("sha256")
    .update("ari-vnext-reasoning-continuity-v1\0", "utf8")
    .update(String(secret || ""), "utf8")
    .digest();
}

function constantTimeTextEqual(a = "", b = "") {
  const left = Buffer.from(String(a), "utf8");
  const right = Buffer.from(String(b), "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function invalid(reason) {
  return { valid: false, reason, state: null };
}

function normalizeEffort(value = "") {
  const effort = clean(value, 20).toLowerCase();
  return ["low", "medium", "high", "xhigh", "max"].includes(effort) ? effort : "medium";
}
function normalizeMode(value = "") {
  return clean(value, 20).toLowerCase() === "pro" ? "pro" : "standard";
}
function normalizeContext(value = "") {
  return clean(value, 30).toLowerCase() === "current_turn" ? "current_turn" : "all_turns";
}
function boundedInt(value, fallback, min, max) {
  const number = Math.floor(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}
function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
