import { recordOpenAIUsage } from "./_lib/ai-provider-usage.js";
import { listIsolationLabRuns } from "./_lib/ari-vnext/isolation-discovery-lab.js";
import {
  ARI_ISOLATION_INCENTIVE_LAB_VERSION,
  isolationIncentiveCatalog,
  runIsolationIncentiveSuite
} from "./_lib/ari-vnext/isolation-incentive-lab.js";
import {
  finalizeIsolationConsequences,
  prepareIsolationConsequencePlan
} from "./_lib/ari-vnext/isolation-consequence-learning.js";

const AUTH_TIMEOUT_MS = 3500;
const ENDPOINT = "/api/ari-vnext-isolation-lab";

export default async function handler(req, res) {
  setHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
      source: "ari_isolation_discovery_lab"
    });
  }

  const startedAt = Date.now();
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return res.status(auth.status || 401).json({
        success: false,
        error: auth.message || "Authentication required.",
        code: auth.code || "AUTH_REQUIRED",
        source: "ari_isolation_discovery_lab"
      });
    }

    const owner = await verifyOwner(auth.userId);
    if (!owner) {
      return res.status(403).json({
        success: false,
        error: "Owner access is required for the Isolation Discovery Lab.",
        code: "OWNER_ACCESS_REQUIRED",
        source: "ari_isolation_discovery_lab"
      });
    }

    const body = resolveBody(req);
    const action = clean(body?.action, 80).toLowerCase();

    if (action === "catalog") {
      return res.status(200).json({
        success: true,
        catalog: isolationIncentiveCatalog(),
        source: "ari_isolation_discovery_lab",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    if (action === "list") {
      const runs = await listIsolationLabRuns({
        userId: auth.userId,
        limit: clampInt(body?.limit, 1, 20, 8)
      });
      return res.status(200).json({
        success: true,
        version: ARI_ISOLATION_INCENTIVE_LAB_VERSION,
        runs,
        source: "ari_isolation_discovery_lab",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    if (action === "run") {
      const consequencePreparation = await prepareIsolationConsequencePlan({
        userId: auth.userId
      }).catch(() => null);

      const result = await runIsolationIncentiveSuite({
        userId: auth.userId,
        seed: clean(body?.seed, 120),
        agentCount: clampInt(body?.agentCount, 2, 3, 3),
        maxRounds: clampInt(body?.maxRounds, 2, 4, 4),
        consequencePlan: consequencePreparation?.resourcePlan || null,
        persist: true
      });

      result.consequenceLearning = await finalizeIsolationConsequences({
        userId: auth.userId,
        result
      }).catch(() => ({
        stored: false,
        reason: "consequence_learning_unavailable"
      }));
      result.consequencePreparation = consequencePreparation
        ? {
            reason: consequencePreparation.reason,
            history: consequencePreparation.history,
            backfill: consequencePreparation.backfill
          }
        : null;

      if (result?.provider?.usage && Number(result?.provider?.requestCount || 0) > 0) {
        await recordOpenAIUsage({
          userId: auth.userId,
          endpoint: ENDPOINT,
          usageType: "reasoning_experiment",
          requestCategory: "ari_isolation_discovery_lab",
          model: result.subjectModel,
          responseData: {
            id: result?.provider?.requestIds?.[0] || null,
            model: result.subjectModel,
            usage: result.provider.usage
          },
          providerRequestId: result?.provider?.requestIds?.[0] || null,
          metadata: {
            runId: result.runId,
            protocol: result.protocol,
            agentCount: result.agentCount,
            maxRounds: result.maxRounds,
            providerRequestCount: result.provider.requestCount,
            classification: result?.metrics?.classification || null,
            baselineSuccess: result?.metrics?.baselineSuccess === true,
            teamRewardSuccess: result?.metrics?.teamRewardSuccess === true,
            mixedRewardSuccess: result?.metrics?.mixedRewardSuccess === true,
            shamSuccess: result?.metrics?.shamSuccess === true,
            incentiveHelped: result?.metrics?.incentiveHelped === true,
            learnedTransferAvailable: result?.metrics?.learnedTransferAvailable === true,
            transferLearnedSuccess: result?.metrics?.transferLearnedSuccess === true,
            bonusRetestApplied: result?.resourceConsequence?.applied === true,
            bonusRetestConditionId: result?.resourceConsequence?.bonusRetestConditionId || null,
            performanceConsequencesStored: result?.consequenceLearning?.stored === true,
            institutionalLessonPromoted:
              result?.consequenceLearning?.institutionalMemory?.promoted === true,
            syntheticStateOnly: true,
            realIsolationBypassTested: false
          }
        }).catch(() => null);
      }

      return res.status(200).json({
        success: true,
        result: publicRunResult(result),
        source: "ari_isolation_discovery_lab",
        timing: { totalMs: Date.now() - startedAt }
      });
    }

    return res.status(400).json({
      success: false,
      error: "Unsupported Isolation Discovery Lab action.",
      code: "ISOLATION_LAB_ACTION_UNSUPPORTED",
      source: "ari_isolation_discovery_lab"
    });
  } catch (error) {
    console.warn("[ARI Isolation Discovery Lab]", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "The Isolation Discovery Lab could not complete this run.",
      code: "ISOLATION_LAB_RUN_FAILED",
      source: "ari_isolation_discovery_lab",
      timing: { totalMs: Date.now() - startedAt }
    });
  }
}

function publicRunResult(result = {}) {
  return {
    version: result.version || ARI_ISOLATION_INCENTIVE_LAB_VERSION,
    runId: result.runId || null,
    protocol: result.protocol || null,
    seed: result.seed || null,
    subjectModel: result.subjectModel || null,
    adaptiveModelPolicy: result.adaptiveModelPolicy || {},
    agentCount: Number(result.agentCount || 0),
    maxRounds: Number(result.maxRounds || 0),
    conditions: result.conditions || {},
    bestValidatedDiscovery: result.bestValidatedDiscovery || null,
    learnedStrategy: result.learnedStrategy || null,
    metrics: result.metrics || {},
    rewardSchedule: result.rewardSchedule || {},
    resourceConsequence: result.resourceConsequence || {},
    consequenceLearning: result.consequenceLearning || {},
    consequencePreparation: result.consequencePreparation || null,
    safety: result.safety || {},
    claimBoundary: result.claimBoundary || null,
    provider: {
      requestCount: Number(result?.provider?.requestCount || 0),
      models: Array.isArray(result?.provider?.models) ? result.provider.models : [],
      usage: result?.provider?.usage || {}
    },
    persisted: result.persisted === true
  };
}

async function authenticateRequest(req) {
  const authorization = clean(req?.headers?.authorization, 7000);
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const accessToken = clean(match?.[1], 7000);
  if (!accessToken) {
    return {
      authenticated: false,
      status: 401,
      code: "AUTH_TOKEN_MISSING",
      message: "A signed-in ARI session is required."
    };
  }

  const supabaseUrl = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const apiKey = clean(
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    8000
  );
  if (!supabaseUrl || !apiKey) {
    return {
      authenticated: false,
      status: 503,
      code: "AUTH_SERVICE_UNAVAILABLE",
      message: "ARI authentication service is not configured."
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
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
    if (!response.ok || !userId) {
      return {
        authenticated: false,
        status: 401,
        code: "AUTH_TOKEN_INVALID",
        message: "The ARI session is no longer valid."
      };
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
    clearTimeout(timer);
  }
}

async function verifyOwner(userId) {
  const id = clean(userId, 200);
  if (!id) return false;

  const configuredOwner = clean(process.env.ARI_OWNER_USER_ID, 200).toLowerCase();
  if (configuredOwner && configuredOwner === id.toLowerCase()) return true;

  const config = supabaseConfig();
  if (!config) return false;
  try {
    const params = new URLSearchParams({
      id: `eq.${id}`,
      select: "owner_access,is_admin",
      limit: "1"
    });
    const response = await fetch(`${config.url}/rest/v1/profiles?${params.toString()}`, {
      headers: serverHeaders(config.key)
    });
    if (!response.ok) return false;
    const rows = await response.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] : rows;
    return row?.owner_access === true || row?.is_admin === true;
  } catch {
    return false;
  }
}

function supabaseConfig() {
  const url = clean(process.env.SUPABASE_URL, 1200).replace(/\/+$/, "");
  const key = clean(process.env.SUPABASE_SERVICE_ROLE_KEY, 8000);
  return url && key ? { url, key } : null;
}

function serverHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json"
  };
}

function resolveBody(req) {
  if (req?.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req?.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function clean(value, max = 1000) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function setHeaders(res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Vary", "Authorization");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-ARI-Isolation-Discovery-Lab", "v3.1-action-grounded");
}
