import { deriveCoachingState } from "./_lib/ari-vnext/coaching-state.js";
import { loadCircleInitiativeEvents } from "./_lib/ari-vnext/circle-event-initiative.js";
import { buildRelevantContext } from "./_lib/ari-vnext/context-router.js";
import { listRecentDecisions, summarizeDecisionState } from "./_lib/ari-vnext/decision-journal.js";
import { listUserExperiments, summarizeExperimentLedger } from "./_lib/ari-vnext/experiment-ledger.js";
import { deriveInitiativeCandidate } from "./_lib/ari-vnext/initiative-engine.js";
import {
  listRecentInitiatives,
  recordInitiativeSurface,
  shouldSuppressInitiative,
  updateInitiativeStatus
} from "./_lib/ari-vnext/initiative-events.js";
import { deriveLongitudinalState } from "./_lib/ari-vnext/longitudinal-state.js";
import { deriveProactiveInsights } from "./_lib/ari-vnext/proactive-insights.js";
import { deriveRelationshipContinuity } from "./_lib/ari-vnext/relationship-continuity.js";
import { deriveTemporalTimeline } from "./_lib/ari-vnext/temporal-timeline.js";
import { deriveUserWorldModel, loadUserWorldModel } from "./_lib/ari-vnext/user-world-model.js";

const AUTH_TIMEOUT_MS = 3500;

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ success: false, error: "Method not allowed.", source: "ari_vnext_initiative" });
  }

  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({ success: false, error: auth.message, code: auth.code, source: "ari_vnext_initiative" });
    }

    const body = resolveBody(req);
    const action = clean(body?.action, 40).toLowerCase() || "check";

    if (action === "engage" || action === "dismiss") {
      const initiativeId = clean(body?.initiativeId, 200);
      if (!initiativeId) return res.status(400).json({ success: false, code: "INITIATIVE_ID_REQUIRED" });
      const updated = await updateInitiativeStatus({
        userId: auth.userId,
        initiativeId,
        status: action === "engage" ? "engaged" : "dismissed"
      });
      return res.status(updated.success ? 200 : 400).json({ ...updated, source: "ari_vnext_initiative" });
    }

    if (action !== "check") {
      return res.status(400).json({ success: false, error: "Unsupported initiative action.", code: "INITIATIVE_ACTION_UNSUPPORTED" });
    }

    const context = body?.context && typeof body.context === "object" && !Array.isArray(body.context) ? body.context : {};
    const now = new Date();
    const route = {
      recentConversation: false,
      profile: true,
      nutrition: true,
      training: true,
      goals: true,
      coachingState: true,
      social: false,
      memory: false,
      health: false,
      currentInfo: false,
      developer: false,
      followUp: false,
      complexity: "fast"
    };
    const turn = {
      userId: auth.userId,
      turnId: `initiative-${Date.now()}`,
      message: "ARI initiative check",
      history: [],
      surface: clean(body?.surface, 200) || "app_open",
      context
    };

    const [experiments, decisions, persistedWorldModel, priorInitiatives, circleEvents] = await Promise.all([
      listUserExperiments({ userId: auth.userId, statuses: ["active", "completed"], limit: 8 }),
      listRecentDecisions({ userId: auth.userId, limit: 16 }),
      loadUserWorldModel({ userId: auth.userId }),
      listRecentInitiatives({ userId: auth.userId, limit: 20 }),
      loadCircleInitiativeEvents({ accessToken: auth.accessToken, userId: auth.userId, now, limit: 12 })
    ]);

    const experimentLedger = summarizeExperimentLedger(experiments);
    const decisionState = summarizeDecisionState(decisions);
    const temporalTimeline = deriveTemporalTimeline({ context, experiments, decisions, limit: 24 });
    turn.context = {
      ...context,
      experimentLedger,
      ...(persistedWorldModel ? { userWorldModel: persistedWorldModel } : {}),
      decisionState,
      ...(temporalTimeline?.eventCount ? { temporalTimeline } : {})
    };

    const relevantContext = buildRelevantContext(turn, route);
    const coachingState = deriveCoachingState({ turn, route, context: relevantContext });
    const longitudinalState = deriveLongitudinalState({ route, context: relevantContext });
    const runtimeWorldModel = deriveUserWorldModel({
      persisted: persistedWorldModel,
      turn,
      context: { ...turn.context, experimentLedger },
      coachingState,
      longitudinalState
    });
    const relationshipContinuity = deriveRelationshipContinuity({
      userWorldModel: runtimeWorldModel,
      decisionState,
      experimentLedger,
      temporalTimeline,
      recentContinuityPairs: 0,
      now
    });
    const proactiveInsights = deriveProactiveInsights({
      coachingState,
      longitudinalState,
      userWorldModel: runtimeWorldModel,
      decisionState,
      experimentLedger
    });
    const initiativeState = deriveInitiativeCandidate({
      proactiveInsights,
      relationshipContinuity,
      experimentLedger,
      circleEvents,
      now
    });

    if (!initiativeState.shouldInitiate || !initiativeState.candidate) {
      return res.status(200).json({
        success: true,
        shouldInitiate: false,
        reason: initiativeState.reason || "nothing_meaningful_enough",
        relationshipContinuity,
        proactiveInsights: compactInsights(proactiveInsights),
        circleEvents: compactCircleEventState(circleEvents),
        cost: { languageModelCalls: 0 },
        source: "ari_vnext_initiative"
      });
    }

    const suppression = shouldSuppressInitiative({ candidate: initiativeState.candidate, events: priorInitiatives, now });
    if (suppression.suppress) {
      return res.status(200).json({
        success: true,
        shouldInitiate: false,
        reason: "repeat_suppressed",
        suppression,
        relationshipContinuity,
        proactiveInsights: compactInsights(proactiveInsights),
        circleEvents: compactCircleEventState(circleEvents),
        cost: { languageModelCalls: 0 },
        source: "ari_vnext_initiative"
      });
    }

    const stored = await recordInitiativeSurface({ userId: auth.userId, candidate: initiativeState.candidate });
    const event = stored?.event || null;
    return res.status(200).json({
      success: true,
      shouldInitiate: true,
      initiative: {
        ...initiativeState.candidate,
        id: event?.id || null,
        surfacedAt: event?.surfacedAt || now.toISOString()
      },
      relationshipContinuity,
      proactiveInsights: compactInsights(proactiveInsights),
      circleEvents: compactCircleEventState(circleEvents),
      persistence: { stored: Boolean(stored?.stored) },
      cost: { languageModelCalls: 0 },
      source: "ari_vnext_initiative"
    });
  } catch (error) {
    console.warn("[ARI vNext Initiative]", error?.message || error);
    return res.status(500).json({
      success: false,
      shouldInitiate: false,
      error: "Ari initiative check is temporarily unavailable.",
      source: "ari_vnext_initiative"
    });
  }
}

function compactInsights(value = null) {
  if (!value) return null;
  return {
    count: Number(value?.count || 0),
    userFacingCount: Number(value?.userFacingCount || 0),
    primary: value?.primary || null
  };
}

function compactCircleEventState(value = null) {
  return {
    available: value?.available === true,
    count: Number(value?.count || 0),
    source: clean(value?.source, 120) || "user_scoped_circle_domain_events",
    directFactsOnly: value?.rules?.directFactsOnly === true,
    clientSuppliedEventAuthority: false,
    mutationAuthority: false
  };
}

async function authenticateRequest(req) {
  const authorization = clean(req?.headers?.authorization, 6000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = clean(match?.[1], 6000);
  if (!accessToken) return { authenticated: false, status: 401, code: "AUTH_TOKEN_MISSING", message: "A signed-in ARI session is required." };

  const supabaseUrl = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const apiKey = clean(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, 7000);
  if (!supabaseUrl || !apiKey) return { authenticated: false, status: 503, code: "AUTH_SERVICE_UNAVAILABLE", message: "ARI authentication service is not configured." };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    const user = data?.user || data;
    const userId = clean(user?.id, 200);
    if (!response.ok || !userId) return { authenticated: false, status: 401, code: "AUTH_TOKEN_INVALID", message: "The ARI session is no longer valid." };
    return { authenticated: true, userId, accessToken };
  } catch (error) {
    return { authenticated: false, status: 503, code: error?.name === "AbortError" ? "AUTH_VERIFICATION_TIMEOUT" : "AUTH_VERIFICATION_FAILED", message: "ARI could not verify the signed-in session." };
  } finally {
    clearTimeout(timeoutId);
  }
}
function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}
function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Initiative", "v1");
}
function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
