import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";
import { buildCurrentTurn, cleanText } from "./_lib/ari-vnext/current-turn.js";
import {
  hydrateRecentConversation,
  persistConversationTurn,
  persistDurableMemory
} from "./_lib/ari-vnext/continuity-service.js";
import { routeContext } from "./_lib/ari-vnext/context-router.js";
import { retrieveRelevantMemories } from "./_lib/ari-vnext/memory-service.js";
import { runAriVNext } from "./_lib/ari-vnext/orchestrator.js";

const AUTH_TIMEOUT_MS = Number(process.env.ARI_AUTH_TIMEOUT_MS) > 0
  ? Number(process.env.ARI_AUTH_TIMEOUT_MS)
  : 3500;

export default async function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_api" });
  }

  const startedAt = Date.now();

  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({
        success: false,
        error: auth.message || "Authentication required.",
        code: auth.code || "AUTH_REQUIRED",
        source: "ari_vnext_api",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    const body = resolveBody(req);
    const turn = buildCurrentTurn(body, auth.userId);

    if (!turn.message) {
      return res.status(400).json({
        success: false,
        error: "Message is required.",
        source: "ari_vnext_api",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    // The browser normally supplies active-thread history. If it is sparse
    // (app relaunch/new surface), recover only a few unexpired recent pairs.
    // The read is hard-bounded so continuity cannot become a latency tax.
    const recentContinuity = await hydrateRecentConversation({
      userId: auth.userId,
      history: turn.history,
      limitPairs: 4
    });
    turn.history = recentContinuity.history;

    const routePreview = routeContext(turn);
    let retrievedMemoryCount = 0;

    if (routePreview.memory || routePreview.training || routePreview.goals) {
      const retrieved = await retrieveRelevantMemories({
        userId: auth.userId,
        message: turn.message,
        limit: routePreview.memory ? 6 : 4
      });

      retrievedMemoryCount = retrieved.memories.length;
      turn.memory = [turn.memory, retrieved.summary].filter(Boolean).join("\n").slice(0, 6000);
    }

    const result = await runAriVNext(turn);

    // Cost telemetry and continuity writes happen together rather than
    // serially. They are never allowed to turn a good Ari answer into a
    // failed response. Continuity writes have their own sub-second limits.
    const usageTask = result?.provider?.usage
      ? recordOpenAIUsage({
          userId: auth.userId,
          endpoint: "/api/ari-vnext",
          usageType: "chat",
          requestCategory: `ari_vnext_${result?.modelPolicy?.mode || "standard"}`,
          model: result?.provider?.model || result?.modelPolicy?.model,
          responseData: {
            id: result?.provider?.id,
            model: result?.provider?.model,
            usage: result?.provider?.usage
          },
          providerRequestId: result?.provider?.id || null,
          metadata: {
            turnId: turn.turnId,
            surface: turn.surface,
            mode: result?.modelPolicy?.mode || null,
            actionType: result?.action?.type || null,
            memoryCount: retrievedMemoryCount,
            recentContinuityPairs: recentContinuity.hydratedPairs,
            route: result?.route || null
          }
        })
      : Promise.resolve(null);

    const turnPersistenceTask = cleanText(result?.reply, 12000)
      ? persistConversationTurn({
          userId: auth.userId,
          message: turn.message,
          reply: result.reply,
          surface: turn.surface
        })
      : Promise.resolve(false);

    // Durable writes are deliberately conservative and deterministic:
    // explicit remember requests, clear preferences, goals, and corrections.
    // No second AI call is used to decide what becomes memory.
    const durableMemoryTask = persistDurableMemory({
      userId: auth.userId,
      message: turn.message
    });

    const [, turnPersistence, durablePersistence] = await Promise.allSettled([
      usageTask,
      turnPersistenceTask,
      durableMemoryTask
    ]);

    const continuityTurnStored = turnPersistence.status === "fulfilled" && turnPersistence.value === true;
    const durableMemoryStored = durablePersistence.status === "fulfilled" && durablePersistence.value?.stored === true;

    return res.status(200).json({
      ...result,
      turnId: turn.turnId,
      memoryUsed: retrievedMemoryCount > 0,
      memoryCount: retrievedMemoryCount,
      recentContinuityPairs: recentContinuity.hydratedPairs,
      continuityTurnStored,
      durableMemoryStored,
      timing: { totalMs: Date.now() - startedAt }
    });
  } catch (error) {
    console.error("[ARI vNext Error]", error);
    return res.status(normalizeStatus(error?.status)).json({
      success: false,
      ready: false,
      error: error?.message || "Ari vNext could not complete the turn.",
      source: "ari_vnext_api",
      timing: { totalMs: Date.now() - startedAt }
    });
  }
}

async function authenticateRequest(req) {
  const authorization = cleanText(req?.headers?.authorization, 5000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = cleanText(match?.[1], 5000);

  if (!accessToken) {
    return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };
  }

  const supabaseUrl = cleanText(process.env.SUPABASE_URL, 1000).replace(/\/+$/, "");
  const supabaseApiKey = cleanText(
    process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    5000
  );

  if (!supabaseUrl || !supabaseApiKey) {
    return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: supabaseApiKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));
    const user = data?.user || data;
    const userId = cleanText(user?.id, 200);

    if (!response.ok || !userId) {
      return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
    }

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

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function normalizeStatus(status) {
  const number = Number(status);
  return Number.isFinite(number) && number >= 400 && number <= 599 ? Math.floor(number) : 500;
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
}
