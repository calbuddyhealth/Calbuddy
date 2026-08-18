import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";
import { enforceAiRateLimit } from "./_lib/ai-rate-limit.js";
import {
  buildPeerReflectionPacket,
  buildReflectionMemory,
  parsePeerReflection,
  peerReflectionInstructions,
  shouldPeerReflect
} from "./_lib/ari-vnext/peer-reflection.js";

const RESPONSES_URL = process.env.OPENAI_RESPONSES_URL || "https://api.openai.com/v1/responses";
const PEER_MODEL = process.env.ARI_VNEXT_PEER_MODEL || "gpt-4o-mini";
const AUTH_TIMEOUT_MS = 3200;
const PEER_TIMEOUT_MS = 12000;
const ENDPOINT = "/api/ari-vnext-peer";

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_peer" });
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({
        success: false,
        error: auth.message || "Authentication required.",
        code: auth.code || "AUTH_REQUIRED",
        source: "ari_vnext_peer"
      });
    }

    const body = resolveBody(req);
    const surface = clean(body?.surface, 200) || "unknown";
    const labAllowed = /ari-vnext-lab\.html/i.test(surface) || /ari-vnext-investigator\.html/i.test(surface);
    const globallyEnabled = process.env.ARI_VNEXT_PEER_REFLECTION_ENABLED === "true";

    // Keep peer reflection experimental while vNext is owner-tested. Enabling
    // this flag later makes the same endpoint available to the production app.
    if (!labAllowed && !globallyEnabled) {
      return res.status(200).json({ success: true, reflected: false, reason: "peer_reflection_disabled" });
    }

    const result = normalizeResult(body?.result);
    const message = clean(body?.message, 1400);
    if (!shouldPeerReflect({ message, result })) {
      return res.status(200).json({ success: true, reflected: false, reason: "not_meaningful_enough" });
    }

    const rate = await enforceAiRateLimit({
      userId: auth.userId,
      endpoint: ENDPOINT,
      rules: [
        { windowSeconds: 20 * 60 * 60, maxRequests: 1 },
        { windowSeconds: 7 * 24 * 60 * 60, maxRequests: 5 }
      ]
    });

    if (!rate.allowed) {
      return res.status(200).json({
        success: true,
        reflected: false,
        reason: "reflection_cooldown",
        retryAfterSeconds: rate.retryAfterSeconds
      });
    }

    const previousReflections = await fetchPreviousReflections(auth.userId, 2);
    const packet = buildPeerReflectionPacket({ message, result, previousReflections });
    const peerResponse = await callPeer({ userId: auth.userId, packet });
    const peerText = extractOutputText(peerResponse);
    const parsed = parsePeerReflection(peerText);
    const memory = buildReflectionMemory({ parsed, result });

    const [usageResult, memoryResult] = await Promise.allSettled([
      recordOpenAIUsage({
        userId: auth.userId,
        endpoint: ENDPOINT,
        usageType: "reflection",
        requestCategory: "ari_vnext_peer_reflection",
        model: peerResponse?.model || PEER_MODEL,
        responseData: peerResponse,
        providerRequestId: peerResponse?.id || null,
        metadata: {
          surface,
          selfMode: result?.selfModel?.current?.mode || null,
          evidenceConfidence: result?.metacognition?.confidence || null,
          leadingHypothesis: result?.scientificIntelligence?.hypotheses?.[0]?.id || null,
          experimentReadiness: result?.scientificIntelligence?.experiment?.readiness || null,
          route: result?.route || null
        }
      }),
      memory ? storeReflectionMemory(auth.userId, memory) : Promise.resolve(false)
    ]);

    return res.status(200).json({
      success: true,
      reflected: Boolean(parsed.takeaway || parsed.question),
      memoryStored: memoryResult.status === "fulfilled" && memoryResult.value === true,
      usageRecorded: usageResult.status === "fulfilled" && Boolean(usageResult.value),
      peer: {
        takeaway: parsed.takeaway,
        question: parsed.question
      },
      source: "ari_vnext_peer"
    });
  } catch (error) {
    console.warn("[ARI vNext Peer]", error?.message || error);
    // Reflection must never make the primary Ari experience brittle.
    return res.status(200).json({
      success: true,
      reflected: false,
      reason: "peer_reflection_unavailable",
      source: "ari_vnext_peer"
    });
  }
}

async function callPeer({ userId, packet } = {}) {
  const apiKey = clean(process.env.OPENAI_API_KEY, 8000);
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PEER_TIMEOUT_MS);
  try {
    const response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: PEER_MODEL,
        instructions: peerReflectionInstructions(),
        input: [{ role: "user", content: packet }],
        max_output_tokens: 260,
        store: false,
        safety_identifier: `ari-peer:${clean(userId, 160)}`,
        prompt_cache_key: "ari-vnext-peer-reflection-v2"
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error?.message || `Peer model request failed (${response.status}).`);
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchPreviousReflections(userId, limit = 2) {
  const config = supabaseConfig();
  if (!config) return [];
  try {
    const params = new URLSearchParams({
      select: "content,updated_at",
      user_id: `eq.${userId}`,
      memory_type: "eq.peer_reflection",
      order: "updated_at.desc",
      limit: String(Math.max(1, Math.min(3, Number(limit) || 2)))
    });
    const response = await fetch(`${config.url}/rest/v1/ari_user_memory?${params.toString()}`, {
      headers: serverHeaders(config.key)
    });
    if (!response.ok) return [];
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function storeReflectionMemory(userId, memory) {
  const config = supabaseConfig();
  if (!config || !memory?.content) return false;
  try {
    const params = new URLSearchParams({ on_conflict: "user_id,content" });
    const response = await fetch(`${config.url}/rest/v1/ari_user_memory?${params.toString()}`, {
      method: "POST",
      headers: serverHeaders(config.key, { Prefer: "resolution=ignore-duplicates,return=minimal" }),
      body: JSON.stringify({
        user_id: userId,
        memory_type: memory.memoryType,
        topic: memory.topic,
        content: memory.content,
        importance: memory.importance,
        confidence: memory.confidence,
        tags: memory.tags,
        type: memory.memoryType,
        domain: memory.topic,
        claim: memory.content,
        source: "ari-vnext-peer"
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

function normalizeResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    reply: clean(value?.reply, 3500),
    route: cleanObject(value?.route),
    safety: cleanObject(value?.safety),
    selfModel: cleanObject(value?.selfModel),
    metacognition: cleanObject(value?.metacognition),
    coachingState: cleanObject(value?.coachingState),
    longitudinalState: cleanObject(value?.longitudinalState),
    scientificIntelligence: cleanObject(value?.scientificIntelligence),
    action: cleanObject(value?.action)
  };
}

function cleanObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return {};
  }
}

function extractOutputText(data = {}) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  if (!Array.isArray(data?.output)) return "";
  return data.output
    .filter((item) => item?.type === "message")
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .filter((part) => part?.type === "output_text" && typeof part?.text === "string")
    .map((part) => part.text)
    .join("")
    .trim();
}

async function authenticateRequest(req) {
  const authorization = clean(req?.headers?.authorization, 6000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = clean(match?.[1], 6000);
  if (!accessToken) return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };

  const supabaseUrl = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const apiKey = clean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, 6000);
  if (!supabaseUrl || !apiKey) return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    const user = data?.user || data;
    const userId = clean(user?.id, 200);
    if (!response.ok || !userId) return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
    return { authenticated: true, userId };
  } catch (error) {
    return {
      authenticated: false,
      status: 503,
      code: error?.name === "AbortError" ? "AUTH_VERIFICATION_TIMEOUT" : "AUTH_VERIFICATION_FAILED",
      message: "ARI could not verify the signed-in session."
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
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

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function clean(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}
