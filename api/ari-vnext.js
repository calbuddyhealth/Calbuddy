import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";
import { loadAccountEntitlements } from "./_lib/ari-vnext/account-entitlements.js";
import { buildCurrentTurn, cleanText } from "./_lib/ari-vnext/current-turn.js";
import {
  buildCommunicationExposure,
  listCommunicationOutcomes,
  recordCommunicationExposure,
  resolveCommunicationOutcomes,
  summarizeCommunicationLearning
} from "./_lib/ari-vnext/communication-outcomes.js";
import {
  hydrateRecentConversation,
  persistConversationTurn,
  persistDurableMemory
} from "./_lib/ari-vnext/continuity-service.js";
import { routeContext } from "./_lib/ari-vnext/context-router.js";
import {
  buildDecisionRecord,
  listRecentDecisions,
  recordDecision,
  summarizeDecisionState
} from "./_lib/ari-vnext/decision-journal.js";
import { listUserExperiments, summarizeExperimentLedger } from "./_lib/ari-vnext/experiment-ledger.js";
import { filterMemoryResultForPrivacy, retrieveRelevantMemories } from "./_lib/ari-vnext/memory-service.js";
import { runAriVNext } from "./_lib/ari-vnext/orchestrator.js";
import { deriveProactiveInsights } from "./_lib/ari-vnext/proactive-insights.js";
import { deriveTemporalTimeline } from "./_lib/ari-vnext/temporal-timeline.js";
import {
  deriveUserWorldModel,
  loadUserWorldModel,
  persistUserWorldModel
} from "./_lib/ari-vnext/user-world-model.js";
import { resolveAriIntelligenceEntitlement } from "../server/ari-intelligence-entitlement.js";
import {
  loadAriCommercialEntitlement,
  loadAriIntelligenceControls
} from "../server/ari-intelligence-control-store.js";

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

    const shouldLoadAdvancedControl = isAdvancedEntitlementCandidate(auth.userId);
    const [intelligenceControls, commercialEntitlement] = await Promise.all([
      shouldLoadAdvancedControl
        ? loadAriIntelligenceControls({ userId: auth.userId })
        : Promise.resolve({ enabled: false, reasoningProfile: "adaptive", source: "not_eligible" }),
      loadAriCommercialEntitlement({ userId: auth.userId })
    ]);
    const intelligenceEntitlement = resolveAriIntelligenceEntitlement({
      userId: auth.userId,
      controls: intelligenceControls,
      subscriptionTier: commercialEntitlement.subscriptionTier,
      subscriptionStatus: commercialEntitlement.subscriptionStatus
    });

    const recentContinuity = shouldRecoverRecentConversation(turn)
      ? await hydrateRecentConversation({
          userId: auth.userId,
          history: turn.history,
          limitPairs: intelligenceEntitlement.advancedEnabled ? 8 : 4
        })
      : { history: turn.history, hydratedPairs: 0 };
    turn.history = recentContinuity.history;

    const routePreview = routeContext(turn);
    const fitnessRoute = Boolean(routePreview.training || routePreview.nutrition || routePreview.goals);
    const shouldLoadMemory = Boolean(routePreview.memory || fitnessRoute);

    const [
      retrievedRaw,
      experiments,
      persistedWorldModel,
      recentDecisions,
      communicationOutcomes,
      accountEntitlements
    ] = await Promise.all([
      shouldLoadMemory
        ? retrieveRelevantMemories({
            userId: auth.userId,
            message: turn.message,
            limit: routePreview.memory ? 6 : 5
          })
        : Promise.resolve({ memories: [], summary: "" }),
      fitnessRoute
        ? listUserExperiments({ userId: auth.userId, statuses: ["active", "completed"], limit: 8 })
        : Promise.resolve([]),
      loadUserWorldModel({ userId: auth.userId }),
      fitnessRoute
        ? listRecentDecisions({ userId: auth.userId, limit: 12 })
        : Promise.resolve([]),
      fitnessRoute
        ? listCommunicationOutcomes({ userId: auth.userId, limit: 24 })
        : Promise.resolve([]),
      loadAccountEntitlements({ userId: auth.userId })
    ]);

    const retrieved = filterMemoryResultForPrivacy(retrievedRaw, persistedWorldModel?.privacyControls || null);
    const retrievedMemoryCount = retrieved.memories.length;
    if (retrieved.summary) {
      turn.memory = [turn.memory, retrieved.summary].filter(Boolean).join("\n").slice(0, 6000);
    }

    const experimentLedger = fitnessRoute ? summarizeExperimentLedger(experiments) : null;
    const decisionState = fitnessRoute ? summarizeDecisionState(recentDecisions) : null;
    const communicationLearning = fitnessRoute ? summarizeCommunicationLearning(communicationOutcomes) : null;
    const temporalTimeline = fitnessRoute
      ? deriveTemporalTimeline({ context: turn.context || {}, experiments, decisions: recentDecisions, limit: 24 })
      : null;

    turn.context = {
      ...(turn.context || {}),
      accountEntitlements,
      intelligenceEntitlement,
      ...(experimentLedger ? { experimentLedger } : {}),
      ...(persistedWorldModel ? { userWorldModel: persistedWorldModel } : {}),
      ...(decisionState ? { decisionState } : {}),
      ...(communicationLearning ? { communicationLearning } : {}),
      ...(temporalTimeline?.eventCount ? { temporalTimeline } : {})
    };

    const result = await runAriVNext(turn);

    const runtimeWorldModel = deriveUserWorldModel({
      persisted: persistedWorldModel,
      turn,
      context: {
        ...(turn.context || {}),
        relevantMemory: turn.memory || "",
        experimentLedger
      },
      communication: result?.communication || null,
      selfModel: result?.selfModel || null,
      coachingState: result?.coachingState || null,
      longitudinalState: result?.longitudinalState || null
    });
    const decisionRecord = fitnessRoute
      ? buildDecisionRecord({ turnId: turn.turnId, route: result?.route || routePreview, result })
      : null;
    const proactiveInsights = fitnessRoute
      ? deriveProactiveInsights({
          coachingState: result?.coachingState || null,
          longitudinalState: result?.longitudinalState || null,
          scientificIntelligence: result?.scientificIntelligence || null,
          userWorldModel: runtimeWorldModel,
          decisionState,
          experimentLedger
        })
      : null;
    const communicationExposure = fitnessRoute
      ? buildCommunicationExposure({ turnId: turn.turnId, route: result?.route || routePreview, result })
      : null;

    const usageTask = result?.provider?.usage
      ? recordOpenAIUsage({
          userId: auth.userId,
          endpoint: "/api/ari-vnext",
          usageType: "chat",
          requestCategory: `ari_vnext_${intelligenceEntitlement.tier}_${result?.modelPolicy?.mode || "standard"}`,
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
            intelligenceTier: intelligenceEntitlement.tier,
            intelligenceSource: intelligenceEntitlement.source,
            reasoningProfile: intelligenceEntitlement.reasoningProfile,
            reasoningEffort: result?.modelPolicy?.reasoningEffort || null,
            mode: result?.modelPolicy?.mode || null,
            actionType: result?.action?.type || null,
            memoryCount: retrievedMemoryCount,
            memoryPrivacyFiltered: Boolean(retrieved?.privacyFiltered),
            recentContinuityPairs: recentContinuity.hydratedPairs,
            activeExperimentCount: experimentLedger?.activeCount || 0,
            dueExperimentCount: experimentLedger?.dueCount || 0,
            leadingHypothesis: result?.scientificIntelligence?.hypotheses?.[0]?.id || null,
            primaryGoal: result?.goalHierarchy?.primary?.id || null,
            goalTradeoffCount: result?.goalHierarchy?.tradeoffs?.length || 0,
            experimentReadiness: result?.scientificIntelligence?.experiment?.readiness || null,
            outcomeLearningApplied: Boolean(result?.scientificIntelligence?.outcomeLearning?.applied),
            calibrationSampleSize: decisionState?.calibration?.sampleSize || 0,
            communicationLearningSamples: communicationLearning?.resolvedCount || 0,
            proactiveInsightCount: proactiveInsights?.userFacingCount || 0,
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

    const durableMemoryTask = persistDurableMemory({
      userId: auth.userId,
      message: turn.message,
      history: turn.history,
      route: result?.route || routePreview,
      privacyControls: runtimeWorldModel?.privacyControls || persistedWorldModel?.privacyControls || null
    });

    const worldModelTask = persistUserWorldModel({ userId: auth.userId, model: runtimeWorldModel });
    const decisionJournalTask = decisionRecord
      ? recordDecision({ userId: auth.userId, record: decisionRecord })
      : Promise.resolve({ stored: false, reason: "not_significant" });
    const communicationResolutionTask = fitnessRoute
      ? resolveCommunicationOutcomes({
          userId: auth.userId,
          longitudinalState: result?.longitudinalState || null,
          message: turn.message
        })
      : Promise.resolve({ resolved: 0 });
    const communicationExposureTask = communicationExposure
      ? recordCommunicationExposure({ userId: auth.userId, exposure: communicationExposure })
      : Promise.resolve({ stored: false, reason: "not_significant" });

    const [
      , turnPersistence, durablePersistence, worldPersistence, decisionPersistence,
      communicationResolution, communicationPersistence
    ] = await Promise.allSettled([
      usageTask,
      turnPersistenceTask,
      durableMemoryTask,
      worldModelTask,
      decisionJournalTask,
      communicationResolutionTask,
      communicationExposureTask
    ]);

    const continuityTurnStored = turnPersistence.status === "fulfilled" && turnPersistence.value === true;
    const durableMemoryStored = durablePersistence.status === "fulfilled" && durablePersistence.value?.stored === true;
    const worldModelStored = worldPersistence.status === "fulfilled" && worldPersistence.value === true;
    const decisionJournalStored = decisionPersistence.status === "fulfilled" && decisionPersistence.value?.stored === true;
    const communicationOutcomeResolved = communicationResolution.status === "fulfilled" ? Number(communicationResolution.value?.resolved || 0) : 0;
    const communicationExposureStored = communicationPersistence.status === "fulfilled" && communicationPersistence.value?.stored === true;

    return res.status(200).json({
      ...result,
      turnId: turn.turnId,
      accountEntitlements,
      intelligenceEntitlement,
      memoryUsed: retrievedMemoryCount > 0,
      memoryCount: retrievedMemoryCount,
      memoryPrivacyFiltered: Boolean(retrieved?.privacyFiltered),
      experimentLedger,
      userWorldModel: runtimeWorldModel,
      decisionState,
      communicationLearning,
      temporalTimeline,
      proactiveInsights,
      recentContinuityPairs: recentContinuity.hydratedPairs,
      continuityTurnStored,
      durableMemoryStored,
      worldModelStored,
      decisionJournalStored,
      communicationOutcomeResolved,
      communicationExposureStored,
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

function shouldRecoverRecentConversation(turn = {}) {
  const history = Array.isArray(turn?.history) ? turn.history : [];
  if (history.length >= 2) return false;

  const text = cleanText(turn?.message, 8000);
  if (!text) return false;

  return /^(why|how so|what about|and|but|then|the other one|make it|do that|instead|continue|pick up)\b|\b(last time|earlier|before|remember when|we talked|we discussed|we decided|you said|you told me|what did we|where were we|continue from|pick up where)\b/i.test(text);
}

function isAdvancedEntitlementCandidate(userId = "") {
  const id = String(userId || "").trim().toLowerCase();
  const ownerId = String(process.env.ARI_OWNER_USER_ID || "").trim().toLowerCase();
  const premiumFeatureEnabled = String(process.env.ARI_PREMIUM_ADVANCED_ENABLED || "").trim().toLowerCase() === "true";
  return Boolean((id && ownerId && id === ownerId) || premiumFeatureEnabled);
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
